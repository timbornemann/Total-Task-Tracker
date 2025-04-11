
# Task Tracker

## Project Description

Task Tracker is a hierarchical task management application that allows users to organize and track their tasks in a structured way. The application uses a parent-child relationship model for tasks, enabling users to create multi-level task hierarchies for better organization and overview of complex projects.

## Core Functionality

### Task Management
- **Create Tasks**: Users can create new top-level tasks with a title, description, and color.
- **Create Subtasks**: Each task can have multiple levels of subtasks, allowing for detailed project breakdowns.
- **View Tasks**: A dashboard view displays all top-level tasks as cards.
- **Task Details**: Users can view detailed information about each task and its subtasks.
- **Update Tasks**: Tasks can be edited to update their title, description, or completion status.
- **Delete Tasks**: Tasks can be deleted, which also removes all subtasks recursively.

### Task Progress Tracking
- **Completion Status**: Each task can be marked as complete or incomplete.
- **Progress Visualization**: Progress bars show the completion percentage of tasks with subtasks.
- **Automatic Progress Calculation**: Parent task progress is calculated based on the completion status of all subtasks.

## User Interface

### Design System
- **Color Scheme**: Uses a clean, modern color palette with primary accent colors and task-specific colors.
- **Typography**: Consistent font usage throughout the application for readability.
- **Components**: Reusable UI components ensure consistency.
- **Animations**: Smooth transitions and animations enhance user experience (fade-in effects, hover states)
- the system should use Talwind css for a consistent look and feel.

### Layout
- **Dashboard**: Grid layout showing task cards with summary information.
- **Task Detail View**: Detailed view of a selected task with its subtasks and actions.
- **Responsive Design**: The interface adapts to different screen sizes for optimal user experience.

### Components
- **Task Cards**: Visual representation of tasks with title, color indicator, and progress.
- **Add Task Form**: Modal dialog for creating new tasks or subtasks.
- **Progress Indicators**: Visual representation of task completion progress.
- **Action Buttons**: Contextual buttons for task operations (add, edit, delete, mark complete).

## Data Model

### Task
- **id**: Unique identifier for the task
- **title**: Short descriptive title
- **description**: Detailed explanation (optional)
- **completed**: Boolean indicating completion status
- **color**: Visual indicator for categorization
- **parent_id**: Reference to parent task (null for top-level tasks)
- **created_at**: Timestamp of creation

## Database Structure

The postgreSQL database uses a simple structure with a single `tasks` table that handles the hierarchical relationship through self-referencing:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  parent_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Future Enhancements

Potential areas for future development:

1. **User Authentication**: Add multi-user support with authentication
2. **Task Sharing**: Allow collaboration on tasks between multiple users
3. **Due Dates & Reminders**: Add scheduling capabilities with notifications
4. **Labels & Tags**: Additional organization options beyond hierarchical structure
5. **Search & Filter**: Advanced search capabilities for large task collections
6. **Data Export/Import**: Allow exporting and importing tasks in various formats
7. **Task Templates**: Reusable task structures for common projects
