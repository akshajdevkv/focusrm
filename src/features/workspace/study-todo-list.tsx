"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  PanelRightClose,
  PanelRightOpen,
  Trash2
} from "lucide-react";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";

export function StudyTodoList({
  collapsed = false,
  onToggleCollapsed
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const [title, setTitle] = useState("");
  const tasks = useWorkspaceStore((state) => state.tasks);
  const addTask = useWorkspaceStore((state) => state.addTask);
  const updateTask = useWorkspaceStore((state) => state.updateTask);
  const toggleTask = useWorkspaceStore((state) => state.toggleTask);
  const deleteTask = useWorkspaceStore((state) => state.deleteTask);
  const moveTask = useWorkspaceStore((state) => state.moveTask);
  const clearCompleted = useWorkspaceStore((state) => state.clearCompleted);
  const completed = tasks.filter((task) => task.completed).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    addTask(nextTitle);
    setTitle("");
  }

  return (
    <aside
      className={cn(
        "relative z-10 min-h-0 overflow-hidden p-5 transition-all duration-300 ease-out",
        onToggleCollapsed && "p-3 lg:h-screen",
        !collapsed && "overflow-y-auto p-5"
      )}
      aria-label="Study tasks"
    >
      <div
        className={cn(
          "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
          collapsed && "justify-center"
        )}
      >
        <div
          className={cn(
            "transition-all duration-200",
            collapsed && "hidden opacity-0"
          )}
        >
          <p className="text-xs font-black uppercase text-primary">
            Study Plan
          </p>
          <h2 className="text-xl font-black">To-Do List</h2>
        </div>
        {onToggleCollapsed ? (
          <Button
            variant="icon"
            aria-label={
              collapsed
                ? "Expand study tasks panel"
                : "Minimize study tasks panel"
            }
            onClick={onToggleCollapsed}
          >
            {collapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </Button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="mt-5 grid justify-center gap-3">
          <span className="rounded-full bg-white/70 px-2 py-1 text-center text-xs font-black text-primary">
            {completed}/{tasks.length}
          </span>
        </div>
      ) : null}

      {onToggleCollapsed && (
        <form
          className={cn(
            "mt-5 grid gap-2 transition-all duration-300",
            collapsed &&
              "pointer-events-none h-0 translate-x-4 overflow-hidden opacity-0"
          )}
          onSubmit={handleSubmit}
        >
          <label
            className="text-sm font-bold text-muted-foreground"
            htmlFor="task-title"
          >
            Add task
          </label>
          <div className="flex gap-2">
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Review lecture notes"
            />
            <Button className="min-h-11 px-5" type="submit">
              Add
            </Button>
          </div>
        </form>
      )}

      {!onToggleCollapsed && (
        <div className="mt-4 grid gap-4 border-t border-white/70 pt-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <form className="grid gap-2" onSubmit={handleSubmit}>
            <label
              className="text-sm font-bold text-muted-foreground"
              htmlFor="task-title"
            >
              Add task
            </label>
            <div className="flex gap-2">
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Review lecture notes"
              />
              <Button className="min-h-11 px-5" type="submit">
                Add
              </Button>
            </div>
          </form>
          <div className="flex min-h-11 items-center justify-between gap-3 lg:justify-end">
            <span className="text-sm font-bold text-muted-foreground">
              {completed}/{tasks.length} complete
            </span>
            <Button
              className="min-h-10 px-4"
              variant="outline"
              size="sm"
              onClick={clearCompleted}
            >
              Clear Done
            </Button>
          </div>
        </div>
      )}

      <ul
        className={cn(
          "mt-4 grid gap-2.5 transition-all duration-300",
          collapsed && "pointer-events-none translate-x-4 opacity-0"
        )}
      >
        {tasks.length === 0 ? (
          <li className="rounded-lg border border-[#ffe3c9]/72 bg-[#fff6eb]/72 p-4 text-sm font-semibold text-muted-foreground shadow-sm">
            No tasks yet. Add one small next step.
          </li>
        ) : null}
        {tasks.map((task) => (
          <li
            key={task.id}
            className={cn(
              "group grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-[#ffe3c9]/72 bg-[#fff6eb]/64 px-3 py-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#ffd4a3] hover:bg-[#fff9f1] hover:shadow-[0_10px_24px_rgba(117,91,62,0.08)]",
              task.completed && "border-emerald-200/80 bg-emerald-50/70"
            )}
          >
            <button
              aria-label={`${task.completed ? "Mark" : "Complete"} ${task.title}`}
              aria-pressed={task.completed}
              type="button"
              onClick={() => toggleTask(task.id)}
              className={cn(
                "todo-check-button relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#d9c7ad] bg-[#fffaf2] text-transparent shadow-sm transition duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff6eb]",
                task.completed &&
                  "is-complete border-emerald-500 bg-emerald-500 text-white shadow-[0_8px_18px_rgba(16,185,129,0.24)]"
              )}
            >
              <Check className="todo-check-icon h-4 w-4" />
            </button>
            <Input
              aria-label="Edit task"
              className={cn(
                "min-h-9 min-w-0 border-transparent bg-transparent px-2 text-sm font-semibold shadow-none transition",
                task.completed &&
                  "text-muted-foreground line-through decoration-2"
              )}
              value={task.title}
              onChange={(event) => updateTask(task.id, event.target.value)}
            />
            <div className="flex shrink-0 gap-1.5">
              <Button
                className="h-9 w-9"
                variant="icon"
                aria-label="Move task up"
                onClick={() => moveTask(task.id, "up")}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                className="h-9 w-9"
                variant="icon"
                aria-label="Move task down"
                onClick={() => moveTask(task.id, "down")}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                className="h-9 w-9"
                variant="icon"
                aria-label="Delete task"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {onToggleCollapsed ? (
        <div
          className={cn(
            "mt-5 flex items-center justify-between gap-3 transition-all duration-300",
            collapsed && "pointer-events-none h-0 overflow-hidden opacity-0"
          )}
        >
          <span className="text-sm font-bold text-muted-foreground">
            {completed}/{tasks.length} complete
          </span>
          <Button
            className="min-h-10 px-4"
            variant="outline"
            size="sm"
            onClick={clearCompleted}
          >
            Clear Done
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
