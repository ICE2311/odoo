'use client';

import { claimTaskAction, updateTaskStatusAction, addFundraiserTaskAction } from '@/server/actions/fundraisers';
import { useState } from 'react';

export default function FundraiserBoardClient({ data, currentUser }: { data: any, currentUser: any }) {
  const { fundraiser, tasks, volunteers } = data;
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleClaim = async (taskId: string) => {
    await claimTaskAction(taskId);
  };

  const handleStatusUpdate = async (taskId: string, status: any) => {
    await updateTaskStatusAction(taskId, status);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await addFundraiserTaskAction(fundraiser.id, { title: newTaskTitle });
    setNewTaskTitle('');
  };

  const columns = ['todo', 'doing', 'done', 'blocked'];
  
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{fundraiser.name}</h1>
          <p className="text-sm text-gray-600">
            Goal: ₹{fundraiser.goalPaise / 100} | Raised: ₹{fundraiser.raisedPaise / 100} 
            ({fundraiser.goalPaise > 0 ? Math.round((fundraiser.raisedPaise / fundraiser.goalPaise) * 100) : 0}%)
          </p>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded">
            <div className="bg-green-600 h-2 rounded" style={{ width: `${Math.min(100, fundraiser.goalPaise > 0 ? (fundraiser.raisedPaise / fundraiser.goalPaise) * 100 : 0)}%` }} />
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-white p-2 border rounded text-center">
            <div className="font-bold">{fundraiser.tasksDone}/{fundraiser.tasksTotal}</div>
            <div className="text-gray-500 text-xs">Tasks Done</div>
          </div>
          <div className="bg-white p-2 border rounded text-center">
            <div className="font-bold">{fundraiser.daysLeft}</div>
            <div className="text-gray-500 text-xs">Days Left</div>
          </div>
          <div className={`p-2 border rounded font-bold flex items-center ${
            fundraiser.onTrack === 'On track' ? 'bg-green-100 text-green-800 border-green-200' :
            fundraiser.onTrack === 'Behind' ? 'bg-orange-100 text-orange-800 border-orange-200' :
            'bg-red-100 text-red-800 border-red-200'
          }`}>
            {fundraiser.onTrack}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col} className="bg-gray-100 p-2 rounded-lg">
            <h3 className="font-bold text-center capitalize mb-2">{col}</h3>
            <div className="space-y-2">
              {tasks.filter((t: any) => t.status === col).map((t: any) => {
                const isOverdue = t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'done';
                return (
                  <div key={t.id} className="bg-white p-2 rounded shadow-sm text-sm">
                    <div className="font-bold mb-1">{t.title}</div>
                    {isOverdue && <div className="text-xs text-red-600 font-bold">Overdue</div>}
                    <div className="text-xs text-gray-500 mb-2">
                      {t.assigneeId ? (
                        <span>Assigned to: {t.assigneeName}</span>
                      ) : (
                        <span className="italic">Unassigned</span>
                      )}
                    </div>
                    
                    {!t.assigneeId && (
                      <button onClick={() => handleClaim(t.id)} className="w-full text-xs bg-blue-100 text-blue-700 py-1 rounded hover:bg-blue-200">
                        Claim Task
                      </button>
                    )}
                    
                    {(t.assigneeId === currentUser.id || currentUser.isAdmin) && (
                      <select 
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t.id, e.target.value)}
                        className="w-full text-xs mt-2 border rounded p-1"
                      >
                        <option value="todo">To Do</option>
                        <option value="doing">Doing</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <input 
          type="text" 
          value={newTaskTitle} 
          onChange={(e) => setNewTaskTitle(e.target.value)} 
          placeholder="New task title"
          className="border rounded p-2 flex-grow"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Task</button>
      </form>
    </div>
  );
}

