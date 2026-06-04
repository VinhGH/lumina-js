import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useLumina } from '@lumina/react';
import { LuminaPanel } from './components/LuminaPanel';
import { flushSync } from 'react-dom';

interface Todo {
  id: string;
  text: string;
}

export default function App() {
  const { currentState, advanceState, reset: runtimeReset, runtime } = useLumina();
  const navigate = useNavigate();

  React.useEffect(() => {
    const el = document.getElementById('workspace-root');
    console.log('[App] Querying workspace-root:', el);
    if (el && runtime) {
      (runtime as any).rootElement = el;
      console.log('[App] Successfully set runtime.rootElement');
    } else {
      console.warn('[App] Failed to set rootElement (element or runtime missing)');
    }
  }, [runtime, currentState]);

  // App local states
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Initialize Lumina.js workspace' },
    { id: '2', text: 'Verify Zero Core Modifications constraint' },
  ]);
  const [newTodoText, setNewTodoText] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Synchronize state transition from app to FSM
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[App] handleLogin called. email:', email, 'password:', password);
    if (email.trim()) {
      setIsLoggedIn(true);
      advanceState('todo-list');
      navigate('/todos');
    } else {
      console.warn('[App] handleLogin failed: email is empty!');
    }
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      const newTodo = {
        id: Date.now().toString(),
        text: newTodoText.trim(),
      };
      setTodos((prev) => [...prev, newTodo]);
      setNewTodoText('');
      advanceState('todo-list');
      navigate('/todos');
    }
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    runtimeReset();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif', background: '#0f0f13', color: '#e5e7eb' }}>
      {/* Main Workspace content */}
      <main id="workspace-root" style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f1f29', paddingBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Lumina Todo App</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>
              Generic framework validation app · currentFSMState: <strong style={{ color: '#3b82f6' }}>{currentState}</strong>
            </p>
          </div>
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Sign Out
            </button>
          )}
        </header>

        <div style={{ flex: 1 }}>
          <Routes>
            {/* 1. Login Page */}
            <Route path="/" element={
              <div style={{ maxWidth: 360, margin: '40px auto', background: '#1e1e24', padding: 24, borderRadius: 8, border: '1px solid #2d2d3a' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Login to Workspace</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Email</label>
                    <input
                      ref={(el) => {
                        if (el) {
                          const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
                          if (descriptor && !(el as any).__lumina_intercepted) {
                            (el as any).__lumina_intercepted = true;
                            Object.defineProperty(el, 'value', {
                              get() {
                                return descriptor.get?.call(this);
                              },
                              set(val) {
                                console.log('[App] Ref Interceptor email set:', val);
                                descriptor.set?.call(this, val);
                                flushSync(() => {
                                  setEmail(val);
                                });
                              },
                              configurable: true,
                            });
                          }
                        }
                      }}
                      id="todo-email"
                      type="email"
                      placeholder="dev-tester@lumina.dev"
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Email address nhập email login đăng nhập"
                      data-lumina-state="login"
                      data-lumina-semantic="primary-input"
                      style={{ background: '#0f0f13', color: '#fff', border: '1px solid #2d2d3a', borderRadius: 4, padding: 8 }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Password</label>
                    <input
                      ref={(el) => {
                        if (el) {
                          const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
                          if (descriptor && !(el as any).__lumina_intercepted) {
                            (el as any).__lumina_intercepted = true;
                            Object.defineProperty(el, 'value', {
                              get() {
                                return descriptor.get?.call(this);
                              },
                              set(val) {
                                console.log('[App] Ref Interceptor password set:', val);
                                descriptor.set?.call(this, val);
                                flushSync(() => {
                                  setPassword(val);
                                });
                              },
                              configurable: true,
                            });
                          }
                        }
                      }}
                      id="todo-password"
                      type="password"
                      placeholder="••••••••"
                      onChange={(e) => setPassword(e.target.value)}
                      aria-label="Password mật khẩu đăng nhập login"
                      data-lumina-state="login"
                      style={{ background: '#0f0f13', color: '#fff', border: '1px solid #2d2d3a', borderRadius: 4, padding: 8 }}
                      required
                    />
                  </div>
                  <button
                    id="todo-login-btn"
                    type="submit"
                    aria-label="Sign In đăng nhập login"
                    data-lumina-state="login"
                    data-lumina-semantic="submit-button"
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 4, padding: 10, cursor: 'pointer', fontWeight: 'bold', marginTop: 10 }}
                  >
                    Sign In
                  </button>
                </form>
              </div>
            } />

            {/* 2. Todo List Page */}
            <Route path="/todos" element={
              <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Active Tasks</h2>
                  <Link
                    to="/create"
                    id="add-todo-link"
                    onClick={() => advanceState('create-todo')}
                    aria-label="Add New Todo tạo công việc mới"
                    data-lumina-state="todo-list"
                    data-lumina-semantic="action-button"
                    style={{ background: '#3b82f6', color: '#fff', textDecoration: 'none', borderRadius: 4, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Add New Todo
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todos.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', margin: '40px 0' }}>All tasks completed! 🎉</p>
                  ) : (
                    todos.map((todo) => (
                      <div key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e24', padding: '12px 16px', borderRadius: 6, border: '1px solid #2d2d3a' }}>
                        <span>{todo.text}</span>
                        <button
                          id={`delete-btn-${todo.id}`}
                          onClick={() => handleDeleteTodo(todo.id)}
                          data-lumina-state="todo-list"
                          data-lumina-semantic="action-button"
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            } />

            {/* 3. Create Todo Page */}
            <Route path="/create" element={
              <div style={{ maxWidth: 480, margin: '0 auto', background: '#1e1e24', padding: 24, borderRadius: 8, border: '1px solid #2d2d3a' }}>
                <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>Create Todo Task</h2>
                <form onSubmit={handleCreateTodo} style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Task Description</label>
                    <input
                      ref={(el) => {
                        if (el) {
                          const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
                          if (descriptor && !(el as any).__lumina_intercepted) {
                            (el as any).__lumina_intercepted = true;
                            Object.defineProperty(el, 'value', {
                              get() {
                                return descriptor.get?.call(this);
                              },
                              set(val) {
                                descriptor.set?.call(this, val);
                                flushSync(() => {
                                  setNewTodoText(val);
                                });
                              },
                              configurable: true,
                            });
                          }
                        }
                      }}
                      id="todo-desc-input"
                      type="text"
                      placeholder="e.g. Write integration test"
                      onChange={(e) => setNewTodoText(e.target.value)}
                      aria-label="Task Description nhập tiêu đề công việc tạo mới"
                      data-lumina-state="create-todo"
                      data-lumina-semantic="primary-input"
                      style={{ background: '#0f0f13', color: '#fff', border: '1px solid #2d2d3a', borderRadius: 4, padding: 8 }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                    <Link
                      to="/todos"
                      onClick={() => advanceState('todo-list')}
                      style={{ background: '#374151', color: '#fff', textDecoration: 'none', borderRadius: 4, padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </Link>
                    <button
                      id="save-todo-btn"
                      type="submit"
                      aria-label="Save Task lưu công việc"
                      data-lumina-state="create-todo"
                      data-lumina-semantic="submit-button"
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                    >
                      Save Task
                    </button>
                  </div>
                </form>
              </div>
            } />
          </Routes>
        </div>
      </main>

      {/* Lumina Dev panel */}
      <LuminaPanel currentPage={currentState} />
    </div>
  );
}
