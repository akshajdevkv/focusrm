import json
import sys

from youtube_transcript import fetch_transcript


if len(sys.argv) != 2:
    raise SystemExit("A video ID is required.")

try:
    print(json.dumps(fetch_transcript(sys.argv[1]), ensure_ascii=False))
except Exception as error:
    print(
        json.dumps(
            {
                "error": str(error),
                "code": type(error).__name__,
            },
            ensure_ascii=False,
        )
    )
    raise SystemExit(2)
