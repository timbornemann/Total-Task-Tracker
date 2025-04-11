<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center">
            <a href="{{ isset($parentTask) ? route('tasks.show', $parentTask) : route('tasks.index') }}" class="inline-flex items-center mr-4 text-gray-500 hover:text-gray-700">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
            </a>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                {{ isset($parentTask) ? 'Add Subtask to "' . $parentTask->title . '"' : 'Create New Task' }}
            </h2>
        </div>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 bg-white border-b border-gray-200">
                    <form method="POST" action="{{ route('tasks.store') }}">
                        @csrf
                        
                        @if(isset($parentTask))
                            <input type="hidden" name="parent_id" value="{{ $parentTask->id }}">
                        @endif

                        <!-- Title -->
                        <div class="mb-4">
                            <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" name="title" id="title" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" value="{{ old('title') }}" required autofocus>
                            @error('title')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Description -->
                        <div class="mb-4">
                            <label for="description" class="block text-sm font-medium text-gray-700">Description (optional)</label>
                            <textarea name="description" id="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">{{ old('description') }}</textarea>
                            @error('description')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Color Selection -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Task Color (optional)</label>
                            <div class="grid grid-cols-6 gap-2">
                                @php
                                    $colors = [
                                        '#3B82F6' => 'Blue',
                                        '#10B981' => 'Green',
                                        '#EC4899' => 'Pink',
                                        '#8B5CF6' => 'Purple',
                                        '#F59E0B' => 'Yellow',
                                        '#EF4444' => 'Red',
                                        '#6B7280' => 'Gray',
                                        '#000000' => 'Black'
                                    ];
                                @endphp
                                
                                @foreach($colors as $color => $name)
                                    <div class="flex items-center">
                                        <input type="radio" id="color_{{ $loop->index }}" name="color" value="{{ $color }}" class="mr-2"
                                            {{ old('color') == $color ? 'checked' : '' }}>
                                        <label for="color_{{ $loop->index }}" class="flex items-center text-sm text-gray-700 cursor-pointer">
                                            <span class="w-5 h-5 mr-1 rounded-full" style="background-color: {{ $color }}"></span>
                                            <span>{{ $name }}</span>
                                        </label>
                                    </div>
                                @endforeach
                            </div>
                            @error('color')
                                <p class="text-red-500 text-xs mt-1">{{ $message }}</p>
                            @enderror
                        </div>

                        <div class="flex justify-end">
                            <a href="{{ isset($parentTask) ? route('tasks.show', $parentTask) : route('tasks.index') }}" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150 mr-3">
                                Cancel
                            </a>
                            <button type="submit" class="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 focus:bg-indigo-700 active:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition ease-in-out duration-150">
                                {{ isset($parentTask) ? 'Add Subtask' : 'Create Task' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</x-app-layout> 