<x-app-layout>
    <x-slot name="header">
        <div class="flex justify-between items-center">
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ __('Task Dashboard') }}
            </h2>
            <a href="{{ route('tasks.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                {{ __('New Task') }}
            </a>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if (session('success'))
                <div class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <span class="block sm:inline">{{ session('success') }}</span>
                </div>
            @endif

            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    @if ($tasks->isEmpty())
                        <div class="text-center py-8">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                            <h3 class="mt-2 text-lg font-medium text-gray-900">No tasks yet</h3>
                            <p class="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                            <div class="mt-6">
                                <a href="{{ route('tasks.create') }}" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                    </svg>
                                    {{ __('New Task') }}
                                </a>
                            </div>
                        </div>
                    @else
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            @foreach ($tasks as $task)
                                <div class="border rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition duration-150 ease-in-out" style="border-left: 4px solid {{ $task->color ?? '#6366F1' }};">
                                    <a href="{{ route('tasks.show', $task) }}" class="flex-1 p-4">
                                        <div class="flex justify-between items-start">
                                            <h3 class="text-lg font-semibold text-gray-900">{{ $task->title }}</h3>
                                            <span class="inline-flex items-center {{ $task->completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }} px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                {{ $task->completed ? 'Completed' : 'In Progress' }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-sm text-gray-500 line-clamp-2">{{ $task->description ?? 'No description' }}</p>
                                        
                                        @if ($task->hasSubtasks())
                                            <div class="mt-4">
                                                <div class="relative pt-1">
                                                    <div class="flex mb-2 items-center justify-between">
                                                        <div>
                                                            <span class="text-xs font-semibold inline-block text-indigo-600">Progress</span>
                                                        </div>
                                                        <div class="text-right">
                                                            <span class="text-xs font-semibold inline-block text-indigo-600">{{ round($task->calculateProgress()) }}%</span>
                                                        </div>
                                                    </div>
                                                    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                                                        <div style="width: {{ $task->calculateProgress() }}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        @endif
                                    </a>
                                    
                                    <div class="border-t px-4 py-3 bg-gray-50 flex justify-between">
                                        <span class="text-xs text-gray-500">{{ $task->subtasks->count() }} subtasks</span>
                                        <span class="text-xs text-gray-500">Created {{ $task->created_at->diffForHumans() }}</span>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</x-app-layout> 