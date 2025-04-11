<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    /**
     * Display a listing of the top-level tasks.
     */
    public function index()
    {
        $tasks = Task::whereNull('parent_id')->with('subtasks')->get();
        return view('tasks.index', compact('tasks'));
    }

    /**
     * Show the form for creating a new task.
     */
    public function create()
    {
        $parentId = request('parent_id');
        $parentTask = null;
        
        if ($parentId) {
            $parentTask = Task::findOrFail($parentId);
        }
        
        return view('tasks.create', compact('parentTask'));
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'parent_id' => 'nullable|exists:tasks,id',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        Task::create($validator->validated());

        return redirect()->route('tasks.index')
            ->with('success', 'Task created successfully.');
    }

    /**
     * Display the specified task and its subtasks.
     */
    public function show(Task $task)
    {
        $task->load('subtasks');
        return view('tasks.show', compact('task'));
    }

    /**
     * Show the form for editing the specified task.
     */
    public function edit(Task $task)
    {
        return view('tasks.edit', compact('task'));
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'completed' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $task->update($validator->validated());

        return redirect()->route('tasks.show', $task)
            ->with('success', 'Task updated successfully.');
    }

    /**
     * Toggle the completion status of a task.
     */
    public function toggleComplete(Task $task)
    {
        $task->completed = !$task->completed;
        $task->save();

        return redirect()->back()
            ->with('success', 'Task status updated.');
    }

    /**
     * Remove the specified task and all its subtasks.
     */
    public function destroy(Task $task)
    {
        $task->delete(); // Cascading delete will remove subtasks

        return redirect()->route('tasks.index')
            ->with('success', 'Task deleted successfully.');
    }
} 