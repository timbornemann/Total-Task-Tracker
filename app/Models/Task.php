<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'completed',
        'color',
        'parent_id',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'created_at' => 'datetime',
    ];

    /**
     * Get the parent task
     */
    public function parent()
    {
        return $this->belongsTo(Task::class, 'parent_id');
    }

    /**
     * Get the subtasks for this task
     */
    public function subtasks()
    {
        return $this->hasMany(Task::class, 'parent_id');
    }

    /**
     * Get all subtasks recursively
     */
    public function allSubtasks()
    {
        return $this->subtasks()->with('allSubtasks');
    }

    /**
     * Check if this task has any subtasks
     */
    public function hasSubtasks()
    {
        return $this->subtasks()->count() > 0;
    }

    /**
     * Calculate progress based on subtasks completion
     */
    public function calculateProgress()
    {
        $subtasks = $this->subtasks;
        
        if ($subtasks->isEmpty()) {
            return $this->completed ? 100 : 0;
        }
        
        $completedCount = $subtasks->where('completed', true)->count();
        return ($completedCount / $subtasks->count()) * 100;
    }
} 