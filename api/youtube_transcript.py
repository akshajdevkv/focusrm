import json
import math
import os
import re
from collections import Counter
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig


VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
SUMMARY_STOP_WORDS = {
    "about", "after", "again", "also", "because", "been", "before", "being",
    "between", "could", "does", "doing", "from", "have", "into", "just",
    "more", "most", "other", "over", "really", "should", "some", "such",
    "than", "that", "their", "them", "then", "there", "these", "they",
    "this", "those", "through", "very", "want", "what", "when", "where",
    "which", "while", "with", "would", "your", "youre",
}


def group_cues(cues, target_duration=20):
    sections = []
    current = []
    section_start = 0
    section_end = 0

    for cue in cues:
        if not current:
            section_start = cue["start"]
        current.append(cue["text"])
        section_end = cue["start"] + cue["duration"]

        if section_end - section_start >= target_duration:
            sections.append(
                {
                    "start": section_start,
                    "duration": round(section_end - section_start, 3),
                    "text": " ".join(current),
                }
            )
            current = []

    if current:
        sections.append(
            {
                "start": section_start,
                "duration": round(max(0, section_end - section_start), 3),
                "text": " ".join(current),
            }
        )

    return sections


def summary_words(text):
    return [
        word
        for word in re.findall(r"[A-Za-z']{3,}", text.lower())
        if word not in SUMMARY_STOP_WORDS
    ]


def transcript_sentences(cues):
    cleaned = " ".join(cue["text"] for cue in cues)
    cleaned = re.sub(r"\[[^]]*\]", " ", cleaned)
    cleaned = re.sub(r"[♪♫]", " ", cleaned)
    cleaned = re.sub(r"\b([A-Za-z']+)(?:\s+\1\b)+", r"\1", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+([,.!?])", r"\1", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    sentences = []
    for raw_sentence in re.split(r"(?<=[.!?])\s+", cleaned):
        sentence = raw_sentence.lstrip(" ,;:–—-").strip()
        words = summary_words(sentence)
        fillers = len(re.findall(r"\b(?:um+|uh+|you know)\b", sentence, re.IGNORECASE))
        if re.search(r"[.!?]$", sentence) and 8 <= len(words) <= 45 and fillers <= 2:
            sentences.append(sentence[:1].upper() + sentence[1:])
    return sentences


def word_overlap(left, right):
    left_set = set(left)
    right_set = set(right)
    union = left_set | right_set
    return len(left_set & right_set) / len(union) if union else 0


def build_summary(cues):
    sentences = transcript_sentences(cues)
    if not sentences:
        return {"overview": "", "keyPoints": []}

    sentence_words = []
    all_words = []
    for sentence in sentences:
        words = summary_words(sentence)
        sentence_words.append(words)
        all_words.extend(words)

    frequencies = Counter(all_words)
    ranked = []
    for index, words in enumerate(sentence_words):
        score = sum(frequencies[word] for word in set(words)) / math.sqrt(len(words))
        ranked.append((score, index, words))
    ranked.sort(reverse=True)

    selected = []
    for item in ranked:
        if all(word_overlap(item[2], previous[2]) < 0.58 for previous in selected):
            selected.append(item)
        if len(selected) == min(5, len(sentences)):
            break

    overview = " ".join(sentences[index] for _, index, _ in sorted(selected[:5], key=lambda item: item[1]))
    key_points = [
        sentences[index]
        for _, index, _ in sorted(selected[:4], key=lambda item: item[1])
    ]
    return {"overview": overview, "keyPoints": key_points}


def transcript_api():
    username = os.getenv("WEBSHARE_PROXY_USERNAME")
    password = os.getenv("WEBSHARE_PROXY_PASSWORD")
    if username and password:
        return YouTubeTranscriptApi(
            proxy_config=WebshareProxyConfig(
                proxy_username=username,
                proxy_password=password,
            )
        )
    return YouTubeTranscriptApi()


def fetch_transcript(video_id):
    available = transcript_api().list(video_id)

    try:
        selected = available.find_transcript(["en"])
    except Exception:
        selected = next(iter(available), None)

    if selected is None:
        raise LookupError("No transcript tracks are available for this video.")

    fetched = selected.fetch()
    cues = [
        {
            "start": round(float(snippet.start), 3),
            "duration": round(float(snippet.duration), 3),
            "text": " ".join(snippet.text.split()),
        }
        for snippet in fetched
        if snippet.text.strip()
    ]
    sections = group_cues(cues)

    return {
        "cues": cues,
        "sections": sections,
        "language": selected.language,
        "languageCode": selected.language_code,
        "isGenerated": selected.is_generated,
        "summary": build_summary(cues),
    }


class handler(BaseHTTPRequestHandler):
    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        query = parse_qs(urlparse(self.path).query)
        video_id = query.get("videoId", [""])[0]

        if not VIDEO_ID_PATTERN.fullmatch(video_id):
            self.send_json(400, {"error": "A valid YouTube video ID is required."})
            return

        try:
            result = fetch_transcript(video_id)
        except Exception as error:
            error_name = type(error).__name__
            if error_name in {"RequestBlocked", "IpBlocked"}:
                message = "YouTube temporarily blocked transcript requests from this server."
                status = 503
            elif error_name in {
                "NoTranscriptFound",
                "TranscriptsDisabled",
                "VideoUnavailable",
                "AgeRestricted",
                "VideoUnplayable",
                "LookupError",
            }:
                message = "Captions are unavailable for this video."
                status = 404
            else:
                message = "The transcript could not be loaded right now."
                status = 502

            self.send_json(status, {"error": message, "code": error_name})
            return

        self.send_json(200, result)
