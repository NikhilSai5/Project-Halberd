// "use client";

// import { useState, useRef, useEffect, useMemo } from "react";
// import { useSettings, type TodoGroup, type TodoItem } from '@/lib/SettingsContext';
// import { Tooltip } from '@/components/Tooltip';

// const dateBadgeStyle = {
//   display: "inline-flex",
//   alignItems: "center",
//   padding: "4px 8px",
//   borderRadius: "9999px",
//   backgroundColor: "rgba(255, 255, 255, 0.15)",
//   backdropFilter: "blur(20px) saturate(180%)",
//   WebkitBackdropFilter: "blur(20px) saturate(180%)",
//   border: "1px solid rgba(255, 255, 255, 0.2)",
//   marginBottom: "10px",
//   boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
// };

// interface HomeProps {
//   showTodoList?: boolean;
// }

// export default function Home({ showTodoList = true }: HomeProps) {
//   const { todoGroups, addTodoToGroup, updateTodo, deleteTodo } = useSettings();
//   const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
//   const [addingTask, setAddingTask] = useState(false);
//   const [newTaskText, setNewTaskText] = useState("");
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});
//   const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

//   const getDayName = () => {
//     const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
//     const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
//     const now = new Date();
//     return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
//   };

//   useEffect(() => {
//     if (todoGroups.length > 0 && !activeGroupId) {
//       setActiveGroupId(todoGroups[0]!.id);
//     }
//   }, [todoGroups, activeGroupId]);

//   const activeGroup = todoGroups.find(g => g.id === activeGroupId);

//   useEffect(() => {
//     if (activeGroup) {
//       const initialStates: Record<string, boolean> = {};
//       activeGroup.todos.forEach(todo => {
//         initialStates[todo.id] = todo.completed;
//       });
//       setTaskStates(initialStates);
//     }
//   }, [activeGroup]);

//   const sortedTodos = useMemo(() => {
//     if (!activeGroup) return [];
//     return [...activeGroup.todos].sort((a, b) => {
//       const aCompleted = taskStates[a.id] || a.completed;
//       const bCompleted = taskStates[b.id] || b.completed;
//       if (aCompleted && !bCompleted) return 1;
//       if (!aCompleted && bCompleted) return -1;
//       return 0;
//     });
//   }, [activeGroup, taskStates]);

//   const expandedGroup = todoGroups.find(g => g.id === expandedGroupId);
//   const sortedExpandedTodos = useMemo(() => {
//     if (!expandedGroup) return [];
//     return [...expandedGroup.todos].sort((a, b) => {
//       const aCompleted = taskStates[a.id] || a.completed;
//       const bCompleted = taskStates[b.id] || b.completed;
//       if (aCompleted && !bCompleted) return 1;
//       if (!aCompleted && bCompleted) return -1;
//       return 0;
//     });
//   }, [expandedGroup, taskStates]);

//   const handleAddTaskClick = () => {
//     setAddingTask(true);
//     setNewTaskText("");
//     setTimeout(() => inputRef.current?.focus(), 50);
//   };

//   const handleSubmitTask = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!newTaskText.trim() || !activeGroupId) return;
//     addTodoToGroup(activeGroupId, newTaskText.trim());
//     setNewTaskText("");
//     setAddingTask(false);
//   };

//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       if (newTaskText.trim() && activeGroupId) {
//         addTodoToGroup(activeGroupId, newTaskText.trim());
//         setNewTaskText("");
//         setAddingTask(false);
//       }
//     } else if (e.key === "Escape") {
//       setAddingTask(false);
//       setNewTaskText("");
//     }
//   };

//   const handleToggleComplete = (todo: TodoItem) => {
//     const newCompleted = !taskStates[todo.id];
//     setTaskStates(prev => ({ ...prev, [todo.id]: newCompleted }));
//     updateTodo(activeGroupId!, todo.id, { completed: newCompleted });
//   };

//   const handleDeleteTask = (todoId: string) => {
//     if (!activeGroupId) return;
//     deleteTodo(activeGroupId, todoId);
//     setTaskStates(prev => {
//       const next = { ...prev };
//       delete next[todoId];
//       return next;
//     });
//   };

//   const handleGroupClick = (groupId: string) => {
//     setActiveGroupId(groupId);
//     setAddingTask(false);
//     setNewTaskText("");
//   };

//   const getIncompleteCount = (group: TodoGroup) => {
//     return group.todos.filter(todo => !taskStates[todo.id] && !todo.completed).length;
//   };

//   const handleCircleClick = (groupId: string) => {
//     setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
//   };

//   return (
//     <div className="page-shell page-shell--centered text-text-primary font-body-main selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
//       {/* Main Workspace */}
//       <main className="page-main page-main--narrow flex-1 flex flex-col justify-start ">
//         {showTodoList ? (
//           <>
//             {/* Header */}
//             <div className="mb-6 text-center">
//               <div style={dateBadgeStyle}>
//                 <span className="caption-copy text-white uppercase tracking-widest ">
//                   {getDayName()}
//                 </span>
//               </div>
//               <h1 className="page-title text-white mt-4">
//                 Good morning.
//               </h1>
//             </div>

//             {/* Group Tabs */}
//             {todoGroups.length > 0 && (
//               <div className="mb-4 flex items-center justify-center gap-1.5 overflow-x-auto px-2 pb-1 -mx-2">
//                 {todoGroups.map((group) => (
//                   <button
//                     key={group.id}
//                     onClick={() => handleGroupClick(group.id)}
//                     className={`group-tab px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
//                       activeGroupId === group.id
//                         ? "bg-primary text-on-primary shadow-sm"
//                         : "bg-surface-container-high text-text-secondary hover:bg-surface-container hover:text-text-primary"
//                     }`}
//                     aria-current={activeGroupId === group.id ? "true" : "false"}
//                   >
//                     {group.name}
//                     <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
//                       activeGroupId === group.id
//                         ? "bg-primary/20 text-on-primary"
//                         : "bg-surface-container text-text-muted"
//                     }`}>
//                       {group.todos.length}
//                     </span>
//                   </button>
//                 ))}
//               </div>
//             )}

//             {/* Task List - Exact Design from HTML */}
//             {activeGroup && (
//               <div className="w-full max-w-2xl mx-auto bg-surface-white rounded-xl border border-border-subtle p-6 md:p-8 glass-panel">
//                 {/* Task List */}
//                 <div className="space-y-0 max-h-[192px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide">
//                   {sortedTodos.map((todo, index) => {
//                     const isCompleted = taskStates[todo.id] || todo.completed;
//                     return (
//                       <label
//                         key={todo.id}
//                         className="flex items-center gap-4 py-3 border-b border-border-subtle cursor-pointer group hover:bg-surface-secondary transition-colors -mx-6 px-6 md:-mx-8 md:px-8"
//                       >
//                         <div className="relative flex items-center justify-center">
//                           <input
//                             type="checkbox"
//                             className="task-checkbox appearance-none w-5 h-5 border border-outline rounded-full checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
//                             aria-label={todo.text}
//                             checked={isCompleted}
//                             onChange={() => handleToggleComplete(todo)}
//                           />
//                           <span
//                             className="material-symbols-outlined absolute text-[14px] text-surface-white pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100"
//                             style={{ fontVariationSettings: "'FILL' 1" }}
//                           >
//                             check
//                           </span>
//                         </div>
//                         <span
//                           className={`font-body-main text-body-main text-text-primary group-hover:text-primary transition-colors flex-1 text-left ${
//                             isCompleted ? "text-text-muted line-through" : ""
//                           }`}
//                         >
//                           {todo.text}
//                         </span>
//                         <button
//                           onClick={(e) => {
//                             e.preventDefault();
//                             e.stopPropagation();
//                             handleDeleteTask(todo.id);
//                           }}
//                           className="text-text-muted hover:text-error transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
//                           aria-label="Delete task"
//                         >
//                           <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
//                         </button>
//                       </label>
//                     );
//                   })}
//                   {sortedTodos.length === 0 && !addingTask && (
//                     <div className="py-12 text-center text-text-muted -mx-6 px-6 md:-mx-8 md:px-8">
//                       <p className="font-body-main text-body-main text-text-muted">No tasks yet. Add one below.</p>
//                     </div>
//                   )}
//                 </div>

//                 {/* Add Task Form - At Bottom */}
//                 {addingTask ? (
//                   <form onSubmit={handleSubmitTask} className="mt-6 pt-6 border-t border-border-subtle -mx-6 px-6 md:-mx-8 md:px-8">
//                     <div className="relative">
//                       <input
//                         ref={inputRef}
//                         type="text"
//                         value={newTaskText}
//                         onChange={(e) => setNewTaskText(e.target.value)}
//                         onKeyDown={handleKeyDown}
//                         onBlur={() => {
//                           if (newTaskText.trim() && activeGroupId) {
//                             addTodoToGroup(activeGroupId, newTaskText.trim());
//                             setNewTaskText("");
//                             setAddingTask(false);
//                           } else setAddingTask(false);
//                         }}
//                         placeholder="What needs to be done?"
//                         className="w-full bg-transparent border-none focus:outline-none font-body-main text-body-main text-text-primary placeholder:text-text-muted py-2"
//                         autoFocus
//                       />
//                       <button
//                         type="submit"
//                         disabled={!newTaskText.trim()}
//                         className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                         aria-label="Add task"
//                       >
//                         <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
//                       </button>
//                     </div>
//                   </form>
//                 ) : (
//                   <div className="pt-6">
//                     <button
//                       onClick={handleAddTaskClick}
//                       className="flex items-center gap-2 text-primary font-section-title text-section-title hover:bg-primary-container/30 px-3 py-2 -ml-3 rounded-lg transition-colors group"
//                     >
//                       <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>
//                         add
//                       </span>
//                       <span>Add task</span>
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {!activeGroup && todoGroups.length > 0 && (
//               <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center text-text-muted">
//                 <p className="text-body-main" style={{ fontSize: '16px', fontWeight: 400 }}>Select a group to view tasks</p>
//               </div>
//             )}

//             {todoGroups.length === 0 && (
//               <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center text-text-muted">
//                 <p className="text-body-main" style={{ fontSize: '16px', fontWeight: 400 }}>No groups yet. Create one in Settings → Productivity.</p>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="flex flex-col items-center justify-center text-center flex-1">
//             {/* Greeting at top */}
//             <div className="w-full max-w-2xl mx-auto px-4 text-center -mt-16">
//               <div style={dateBadgeStyle}>
//                 <span className="caption-copy text-white uppercase tracking-widest">
//                   {getDayName()}
//                 </span>
//               </div>
//               <h1 className={`font-headline-page text-headline-page text-white transition-all duration-300 ${
//                 expandedGroupId ? "text-3xl md:text-4xl font-normal" : "text-6xl md:text-7xl font-light"
//               }`}>
//                 Good Morning
//               </h1>

//               {/* Group Circles */}
//               {todoGroups.length > 0 && (
//                 <div className="mt-2 flex items-center justify-center gap-3">
//                   {todoGroups.map((group) => {
//                     const incompleteCount = getIncompleteCount(group);
//                     const isExpanded = expandedGroupId === group.id;
//                     return (
//                       <Tooltip
//                         key={group.id}
//                         content={group.name}
//                         side="bottom"
//                         align="center"
//                         offset={8}
//                         delay={200}
//                         hideDelay={100}
//                       >
//                         <button
//                           onClick={() => handleCircleClick(group.id)}
//                           style={dateBadgeStyle}
//                           className={`relative w-6 h-6 md:w-6 md:h-6 rounded-full border-2 border-border-subtle bg-surface-container-low glass-panel flex items-center justify-center transition-all duration-300 hover:border-primary hover:shadow-md hover:scale-[1.1] active:scale-95 ${
//                             isExpanded ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-white scale-105 animate-pulse-subtle" : ""
//                           }`}
//                           aria-label={`${group.name}: ${incompleteCount} tasks remaining`}
//                         >
//                           <span className="text-md md:text-md font-Regular text-white">
//                             {incompleteCount}
//                           </span>
//                         </button>
//                       </Tooltip>
//                     );
//                   })}
//                 </div>
//               )}

//               {todoGroups.length === 0 && (
//                 <div className="mt-8 text-center text-text-muted">
//                   <p className="body-copy">No groups yet. Create one in Settings → Productivity.</p>
//                 </div>
//               )}
//             </div>

// {/* Expanded Group Tasks */}
//             {expandedGroupId && (
//               <div className="w-full max-w-2xl mx-auto px-4 mt-6 animate-fade-in">
//                 <div className="bg-surface-white rounded-xl border border-border-subtle p-6 md:p-8 glass-panel">
//                   <div className="space-y-0 max-h-[192px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide">
//                     {sortedExpandedTodos.map((todo) => {
//                       const isCompleted = taskStates[todo.id] || todo.completed;
//                       return (
//                         <label
//                           key={todo.id}
//                           className="flex items-center gap-4 py-3 border-b border-border-subtle cursor-pointer group hover:bg-surface-secondary transition-colors -mx-6 px-6 md:-mx-8 md:px-8"
//                         >
//                           <div className="relative flex items-center justify-center">
//                             <input
//                               type="checkbox"
//                               className="task-checkbox appearance-none w-5 h-5 border border-outline rounded-full checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
//                               aria-label={todo.text}
//                               checked={isCompleted}
//                               onChange={() => handleToggleComplete(todo)}
//                             />
//                             <span
//                               className="material-symbols-outlined absolute text-[14px] text-surface-white pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100"
//                               style={{ fontVariationSettings: "'FILL' 1" }}
//                             >
//                               check
//                             </span>
//                           </div>
//                           <span
//                             className={`font-body-main text-body-main text-text-primary group-hover:text-primary transition-colors flex-1 text-left ${
//                               isCompleted ? "text-text-muted line-through" : ""
//                             }`}
//                           >
//                             {todo.text}
//                           </span>
//                           <button
//                             onClick={(e) => {
//                               e.preventDefault();
//                               e.stopPropagation();
//                               handleDeleteTask(todo.id);
//                             }}
//                             className="text-text-muted hover:text-error transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
//                             aria-label="Delete task"
//                           >
//                             <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
//                           </button>
//                         </label>
//                       );
//                     })}
//                   </div>

//                   {/* Add Task Form - At Bottom */}
//                   {addingTask ? (
//                     <form onSubmit={handleSubmitTask} className="mt-6 pt-6 border-t border-border-subtle -mx-6 px-6 md:-mx-8 md:px-8">
//                       <div className="relative">
//                         <input
//                           ref={inputRef}
//                           type="text"
//                           value={newTaskText}
//                           onChange={(e) => setNewTaskText(e.target.value)}
//                           onKeyDown={handleKeyDown}
//                           onBlur={() => {
//                             if (newTaskText.trim() && activeGroupId) {
//                               addTodoToGroup(activeGroupId, newTaskText.trim());
//                               setNewTaskText("");
//                               setAddingTask(false);
//                             } else setAddingTask(false);
//                           }}
//                           placeholder="What needs to be done?"
//                           className="w-full bg-transparent border-none focus:outline-none font-body-main text-body-main text-text-primary placeholder:text-text-muted py-2"
//                           autoFocus
//                         />
//                         <button
//                           type="submit"
//                           disabled={!newTaskText.trim()}
//                           className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                           aria-label="Add task"
//                         >
//                           <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
//                         </button>
//                       </div>
//                     </form>
//                   ) : (
//                     <div className="pt-6">
//                       <button
//                         onClick={() => {
//                           setAddingTask(true);
//                           setNewTaskText("");
//                           setTimeout(() => inputRef.current?.focus(), 50);
//                         }}
//                         className="flex items-center gap-2 text-primary font-section-title text-section-title hover:bg-primary-container/30 px-3 py-2 -ml-3 rounded-lg transition-colors group"
//                       >
//                         <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>
//                           add
//                         </span>
//                         <span>Add task</span>
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import {
  useSettings,
  type TodoGroup,
  type TodoItem,
} from "@/lib/SettingsContext";
import { Tooltip } from "@/components/Tooltip";

const dateBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  borderRadius: "9999px",
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  marginBottom: "10px",
  boxShadow:
    "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
};

interface HomeProps {
  showTodoList?: boolean;
}

export default function Home({ showTodoList = true }: HomeProps) {
  const {
    todoGroups,
    addTodoToGroup,
    updateTodo,
    deleteTodo,
  } = useSettings();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [taskStates, setTaskStates] = useState<Record<string, boolean>>({});
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  /*
   * ================================================================
   * GREETING GROUP ANIMATION
   * ================================================================
   *
   * This ref is attached to the ENTIRE greeting section:
   *
   *   - Date badge
   *   - Good Morning
   *   - Circle buttons
   *
   * Therefore all three move together as one unit.
   */

  const greetingGroupRef = useRef<HTMLDivElement>(null);

  const previousGreetingRectRef = useRef<DOMRect | null>(null);

  const animationFrameRef = useRef<number | null>(null);

  /*
   * Capture the current position BEFORE changing the layout.
   */
  const handleCircleClick = (groupId: string) => {
    if (greetingGroupRef.current) {
      previousGreetingRectRef.current =
        greetingGroupRef.current.getBoundingClientRect();
    }

    setExpandedGroupId((currentId) =>
      currentId === groupId ? null : groupId
    );
  };

  /*
   * ================================================================
   * FLIP POSITION ANIMATION
   * ================================================================
   *
   * After expandedGroupId changes:
   *
   * OLD POSITION
   *     ↓
   * Layout changes naturally
   *     ↓
   * NEW POSITION
   *     ↓
   * Temporarily move group back to OLD POSITION
   *     ↓
   * Animate transform back to 0
   *
   * This means the final position is still determined by the
   * existing layout. No hardcoded top/translate values are used.
   */

  useLayoutEffect(() => {
    const greetingGroup = greetingGroupRef.current;
    const previousRect = previousGreetingRectRef.current;

    if (!greetingGroup || !previousRect) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const newRect = greetingGroup.getBoundingClientRect();

    const deltaX = previousRect.left - newRect.left;
    const deltaY = previousRect.top - newRect.top;

    previousGreetingRectRef.current = null;

    /*
     * Respect user's reduced-motion preference.
     */
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      greetingGroup.style.transform = "";
      greetingGroup.style.transition = "";
      return;
    }

    /*
     * If the position barely changed, don't animate.
     */
    if (
      Math.abs(deltaX) < 0.5 &&
      Math.abs(deltaY) < 0.5
    ) {
      greetingGroup.style.transform = "";
      greetingGroup.style.transition = "";
      return;
    }

    /*
     * ============================================================
     * FIRST FRAME
     * ============================================================
     *
     * Put the ENTIRE greeting group back at its old location.
     *
     * This moves:
     *
     *   ✓ date badge
     *   ✓ Good Morning
     *   ✓ circle buttons
     *
     * together.
     */

    greetingGroup.style.transition = "none";

    greetingGroup.style.transform =
      `translate3d(${deltaX}px, ${deltaY}px, 0)`;

    /*
     * Force layout so the browser recognizes the starting position.
     */
    void greetingGroup.offsetHeight;

    /*
     * ============================================================
     * ANIMATE TO NEW POSITION
     * ============================================================
     */

    animationFrameRef.current = requestAnimationFrame(() => {
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!greetingGroupRef.current) {
          return;
        }

        greetingGroupRef.current.style.transition =
          "transform 650ms cubic-bezier(0.22, 1, 0.36, 1)";

        greetingGroupRef.current.style.transform =
          "translate3d(0, 0, 0)";

        animationFrameRef.current = null;
      });
    });

    /*
     * Remove temporary inline styles after animation.
     */
    const cleanupTimer = window.setTimeout(() => {
      if (greetingGroupRef.current) {
        greetingGroupRef.current.style.transform = "";
        greetingGroupRef.current.style.transition = "";
      }
    }, 700);

    return () => {
      window.clearTimeout(cleanupTimer);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [expandedGroupId]);

  /*
   * ================================================================
   * DATE
   * ================================================================
   */

  const getDayName = () => {
    const days = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];

    const months = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];

    const now = new Date();

    return `${days[now.getDay()]} · ${
      months[now.getMonth()]
    } ${now.getDate()}`;
  };

  /*
   * ================================================================
   * GROUP / TODO STATE
   * ================================================================
   */

  useEffect(() => {
    if (todoGroups.length > 0 && !activeGroupId) {
      setActiveGroupId(todoGroups[0]!.id);
    }
  }, [todoGroups, activeGroupId]);

  const activeGroup = todoGroups.find(
    (group) => group.id === activeGroupId
  );

  useEffect(() => {
    if (activeGroup) {
      const initialStates: Record<string, boolean> = {};

      activeGroup.todos.forEach((todo) => {
        initialStates[todo.id] = todo.completed;
      });

      setTaskStates(initialStates);
    }
  }, [activeGroup]);

  const sortedTodos = useMemo(() => {
    if (!activeGroup) return [];

    return [...activeGroup.todos].sort((a, b) => {
      const aCompleted =
        taskStates[a.id] || a.completed;

      const bCompleted =
        taskStates[b.id] || b.completed;

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      return 0;
    });
  }, [activeGroup, taskStates]);

  const expandedGroup = todoGroups.find(
    (group) => group.id === expandedGroupId
  );

  const sortedExpandedTodos = useMemo(() => {
    if (!expandedGroup) return [];

    return [...expandedGroup.todos].sort((a, b) => {
      const aCompleted =
        taskStates[a.id] || a.completed;

      const bCompleted =
        taskStates[b.id] || b.completed;

      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      return 0;
    });
  }, [expandedGroup, taskStates]);

  /*
   * ================================================================
   * TASK HANDLERS
   * ================================================================
   */

  const handleAddTaskClick = () => {
    setAddingTask(true);
    setNewTaskText("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSubmitTask = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!newTaskText.trim() || !activeGroupId) {
      return;
    }

    addTodoToGroup(
      activeGroupId,
      newTaskText.trim()
    );

    setNewTaskText("");
    setAddingTask(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (
        newTaskText.trim() &&
        activeGroupId
      ) {
        addTodoToGroup(
          activeGroupId,
          newTaskText.trim()
        );

        setNewTaskText("");
        setAddingTask(false);
      }
    } else if (e.key === "Escape") {
      setAddingTask(false);
      setNewTaskText("");
    }
  };

  const handleToggleComplete = (
    todo: TodoItem
  ) => {
    const newCompleted =
      !taskStates[todo.id];

    setTaskStates((prev) => ({
      ...prev,
      [todo.id]: newCompleted,
    }));

    updateTodo(
      activeGroupId!,
      todo.id,
      {
        completed: newCompleted,
      }
    );
  };

  const handleDeleteTask = (
    todoId: string
  ) => {
    if (!activeGroupId) return;

    deleteTodo(
      activeGroupId,
      todoId
    );

    setTaskStates((prev) => {
      const next = { ...prev };

      delete next[todoId];

      return next;
    });
  };

  const handleGroupClick = (
    groupId: string
  ) => {
    setActiveGroupId(groupId);
    setAddingTask(false);
    setNewTaskText("");
  };

  const getIncompleteCount = (
    group: TodoGroup
  ) => {
    return group.todos.filter(
      (todo) =>
        !taskStates[todo.id] &&
        !todo.completed
    ).length;
  };

  /*
   * ================================================================
   * RENDER
   * ================================================================
   */

  return (
    <div className="page-shell page-shell--centered text-text-primary font-body-main selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      <main className="page-main page-main--narrow flex-1 flex flex-col justify-start">

        {showTodoList ? (
          <>
            {/* ==========================================================
                NORMAL TODO PAGE
                ========================================================== */}

            <div className="mb-6 text-center">
              <div style={dateBadgeStyle}>
                <span className="caption-copy text-white uppercase tracking-widest">
                  {getDayName()}
                </span>
              </div>

              <h1 className="page-title text-white mt-4">
                Good morning.
              </h1>
            </div>

            {todoGroups.length > 0 && (
              <div className="mb-4 flex items-center justify-center gap-1.5 overflow-x-auto px-2 pb-1 -mx-2">
                {todoGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() =>
                      handleGroupClick(group.id)
                    }
                    className={`group-tab px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      activeGroupId === group.id
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-high text-text-secondary hover:bg-surface-container hover:text-text-primary"
                    }`}
                    aria-current={
                      activeGroupId === group.id
                        ? "true"
                        : "false"
                    }
                  >
                    {group.name}

                    <span
                      className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${
                        activeGroupId === group.id
                          ? "bg-primary/20 text-on-primary"
                          : "bg-surface-container text-text-muted"
                      }`}
                    >
                      {group.todos.length}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeGroup && (
              <div className="w-full max-w-2xl mx-auto bg-surface-white rounded-xl border border-border-subtle p-6 md:p-8 glass-panel">

                <div className="space-y-0 max-h-[192px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide">

                  {sortedTodos.map((todo) => {
                    const isCompleted =
                      taskStates[todo.id] ||
                      todo.completed;

                    return (
                      <label
                        key={todo.id}
                        className="flex items-center gap-4 py-3 border-b border-border-subtle cursor-pointer group hover:bg-surface-secondary transition-colors -mx-6 px-6 md:-mx-8 md:px-8"
                      >
                        <div className="relative flex items-center justify-center">

                          <input
                            type="checkbox"
                            className="task-checkbox appearance-none w-5 h-5 border border-outline rounded-full checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
                            aria-label={todo.text}
                            checked={isCompleted}
                            onChange={() =>
                              handleToggleComplete(todo)
                            }
                          />

                          <span
                            className="material-symbols-outlined absolute text-[14px] text-surface-white pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100"
                            style={{
                              fontVariationSettings:
                                "'FILL' 1",
                            }}
                          >
                            check
                          </span>

                        </div>

                        <span
                          className={`font-body-main text-body-main text-text-primary group-hover:text-primary transition-colors flex-1 text-left ${
                            isCompleted
                              ? "text-text-muted line-through"
                              : ""
                          }`}
                        >
                          {todo.text}
                        </span>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            handleDeleteTask(
                              todo.id
                            );
                          }}
                          className="text-text-muted hover:text-error transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                          aria-label="Delete task"
                        >
                          <span
                            className="material-symbols-outlined text-[16px]"
                            aria-hidden="true"
                          >
                            close
                          </span>
                        </button>
                      </label>
                    );
                  })}

                  {sortedTodos.length === 0 &&
                    !addingTask && (
                      <div className="py-12 text-center text-text-muted -mx-6 px-6 md:-mx-8 md:px-8">
                        <p className="font-body-main text-body-main text-text-muted">
                          No tasks yet. Add one below.
                        </p>
                      </div>
                    )}

                </div>

                {addingTask ? (
                  <form
                    onSubmit={handleSubmitTask}
                    className="mt-6 pt-6 border-t border-border-subtle -mx-6 px-6 md:-mx-8 md:px-8"
                  >
                    <div className="relative">

                      <input
                        ref={inputRef}
                        type="text"
                        value={newTaskText}
                        onChange={(e) =>
                          setNewTaskText(
                            e.target.value
                          )
                        }
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          if (
                            newTaskText.trim() &&
                            activeGroupId
                          ) {
                            addTodoToGroup(
                              activeGroupId,
                              newTaskText.trim()
                            );

                            setNewTaskText("");
                            setAddingTask(false);
                          } else {
                            setAddingTask(false);
                          }
                        }}
                        placeholder="What needs to be done?"
                        className="w-full bg-transparent border-none focus:outline-none font-body-main text-body-main text-text-primary placeholder:text-text-muted py-2"
                        autoFocus
                      />

                      <button
                        type="submit"
                        disabled={
                          !newTaskText.trim()
                        }
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Add task"
                      >
                        <span
                          className="material-symbols-outlined text-[22px]"
                          style={{
                            fontVariationSettings:
                              "'FILL' 1",
                          }}
                        >
                          check
                        </span>
                      </button>

                    </div>
                  </form>
                ) : (
                  <div className="pt-6">

                    <button
                      onClick={
                        handleAddTaskClick
                      }
                      className="flex items-center gap-2 text-primary font-section-title text-section-title hover:bg-primary-container/30 px-3 py-2 -ml-3 rounded-lg transition-colors group"
                    >
                      <span
                        className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300"
                        style={{
                          fontVariationSettings:
                            "'FILL' 1",
                        }}
                      >
                        add
                      </span>

                      <span>Add task</span>
                    </button>

                  </div>
                )}

              </div>
            )}

            {!activeGroup &&
              todoGroups.length > 0 && (
                <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center text-text-muted">
                  <p
                    className="text-body-main"
                    style={{
                      fontSize: "16px",
                      fontWeight: 400,
                    }}
                  >
                    Select a group to view tasks
                  </p>
                </div>
              )}

            {todoGroups.length === 0 && (
              <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center text-text-muted">
                <p
                  className="text-body-main"
                  style={{
                    fontSize: "16px",
                    fontWeight: 400,
                  }}
                >
                  No groups yet. Create one in
                  Settings → Productivity.
                </p>
              </div>
            )}
          </>
        ) : (
          /* ================================================================
             HOME PAGE
             ================================================================ */

          <div className="flex flex-col items-center justify-center text-center flex-1">

            {/*
             * ============================================================
             * ENTIRE GREETING GROUP
             * ============================================================
             *
             * The animation ref is HERE.
             *
             * Date badge + greeting + circles are now one moving object.
             */}

            <div
              ref={greetingGroupRef}
              className="w-full max-w-2xl mx-auto px-4 text-center -mt-16 will-change-transform"
            >

              {/* DATE */}
              <div style={dateBadgeStyle}>
                <span className="caption-copy text-white uppercase tracking-widest">
                  {getDayName()}
                </span>
              </div>

              {/* GREETING */}

              <h1
                className={`font-headline-page text-headline-page text-white ${
                  expandedGroupId
                    ? "text-3xl md:text-4xl font-normal"
                    : "text-6xl md:text-7xl font-light"
                }`}
                style={{
                  transition:
                    "font-size 650ms cubic-bezier(0.22, 1, 0.36, 1), line-height 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                Good Morning
              </h1>

              {/* CIRCLE BUTTONS */}

              {todoGroups.length > 0 && (
                <div className="mt-2 flex items-center justify-center gap-3">

                  {todoGroups.map((group) => {
                    const incompleteCount =
                      getIncompleteCount(group);

                    const isExpanded =
                      expandedGroupId === group.id;

                    return (
                      <Tooltip
                        key={group.id}
                        content={group.name}
                        side="bottom"
                        align="center"
                        offset={8}
                        delay={200}
                        hideDelay={100}
                      >
                        <button
                          onClick={() =>
                            handleCircleClick(
                              group.id
                            )
                          }
                          style={dateBadgeStyle}
                          className={`relative w-6 h-6 md:w-6 md:h-6 rounded-full border-2 border-border-subtle bg-surface-container-low glass-panel flex items-center justify-center transition-all duration-300 hover:border-primary hover:shadow-md hover:scale-[1.1] active:scale-95 ${
                            isExpanded
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-white scale-105 animate-pulse-subtle"
                              : ""
                          }`}
                          aria-label={`${group.name}: ${incompleteCount} tasks remaining`}
                        >
                          <span className="text-md md:text-md font-Regular text-white">
                            {incompleteCount}
                          </span>
                        </button>
                      </Tooltip>
                    );
                  })}

                </div>
              )}

              {todoGroups.length === 0 && (
                <div className="mt-8 text-center text-text-muted">
                  <p className="body-copy">
                    No groups yet. Create one in
                    Settings → Productivity.
                  </p>
                </div>
              )}

            </div>

            {/* ============================================================
                EXPANDED TODO LIST
                ============================================================ */}

            {expandedGroupId && (
              <div className="w-full max-w-2xl mx-auto px-4 mt-6 animate-fade-in">

                <div className="bg-surface-white rounded-xl border border-border-subtle p-6 md:p-8 glass-panel">

                  <div className="space-y-0 max-h-[192px] overflow-y-auto overflow-x-hidden pr-1 scrollbar-hide">

                    {sortedExpandedTodos.map(
                      (todo) => {
                        const isCompleted =
                          taskStates[todo.id] ||
                          todo.completed;

                        return (
                          <label
                            key={todo.id}
                            className="flex items-center gap-4 py-3 border-b border-border-subtle cursor-pointer group hover:bg-surface-secondary transition-colors -mx-6 px-6 md:-mx-8 md:px-8"
                          >

                            <div className="relative flex items-center justify-center">

                              <input
                                type="checkbox"
                                className="task-checkbox appearance-none w-5 h-5 border border-outline rounded-full checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
                                aria-label={
                                  todo.text
                                }
                                checked={
                                  isCompleted
                                }
                                onChange={() =>
                                  handleToggleComplete(
                                    todo
                                  )
                                }
                              />

                              <span
                                className="material-symbols-outlined absolute text-[14px] text-surface-white pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100"
                                style={{
                                  fontVariationSettings:
                                    "'FILL' 1",
                                }}
                              >
                                check
                              </span>

                            </div>

                            <span
                              className={`font-body-main text-body-main text-text-primary group-hover:text-primary transition-colors flex-1 text-left ${
                                isCompleted
                                  ? "text-text-muted line-through"
                                  : ""
                              }`}
                            >
                              {todo.text}
                            </span>

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                handleDeleteTask(
                                  todo.id
                                );
                              }}
                              className="text-text-muted hover:text-error transition-colors p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                              aria-label="Delete task"
                            >
                              <span
                                className="material-symbols-outlined text-[16px]"
                                aria-hidden="true"
                              >
                                close
                              </span>
                            </button>

                          </label>
                        );
                      }
                    )}

                  </div>

                  {addingTask ? (
                    <form
                      onSubmit={
                        handleSubmitTask
                      }
                      className="mt-6 pt-6 border-t border-border-subtle -mx-6 px-6 md:-mx-8 md:px-8"
                    >
                      <div className="relative">

                        <input
                          ref={inputRef}
                          type="text"
                          value={newTaskText}
                          onChange={(e) =>
                            setNewTaskText(
                              e.target.value
                            )
                          }
                          onKeyDown={
                            handleKeyDown
                          }
                          onBlur={() => {
                            if (
                              newTaskText.trim() &&
                              activeGroupId
                            ) {
                              addTodoToGroup(
                                activeGroupId,
                                newTaskText.trim()
                              );

                              setNewTaskText("");
                              setAddingTask(false);
                            } else {
                              setAddingTask(false);
                            }
                          }}
                          placeholder="What needs to be done?"
                          className="w-full bg-transparent border-none focus:outline-none font-body-main text-body-main text-text-primary placeholder:text-text-muted py-2"
                          autoFocus
                        />

                        <button
                          type="submit"
                          disabled={
                            !newTaskText.trim()
                          }
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Add task"
                        >
                          <span
                            className="material-symbols-outlined text-[22px]"
                            style={{
                              fontVariationSettings:
                                "'FILL' 1",
                            }}
                          >
                            check
                          </span>
                        </button>

                      </div>
                    </form>
                  ) : (
                    <div className="pt-6">

                      <button
                        onClick={() => {
                          setAddingTask(true);
                          setNewTaskText("");

                          setTimeout(() => {
                            inputRef.current?.focus();
                          }, 50);
                        }}
                        className="flex items-center gap-2 text-primary font-section-title text-section-title hover:bg-primary-container/30 px-3 py-2 -ml-3 rounded-lg transition-colors group"
                      >
                        <span
                          className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300"
                          style={{
                            fontVariationSettings:
                              "'FILL' 1",
                          }}
                        >
                          add
                        </span>

                        <span>Add task</span>
                      </button>

                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}