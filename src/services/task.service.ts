// import { db, storage } from '../firebase/config';
import type { Task, TaskPhoto } from '../types';

// Dummy implementation for task operations
export const fetchTasks = async () => {
  console.log('Task service disabled');
  return [];
};

export const addTask = async (taskData: Partial<Task>) => {
  console.log('Task service disabled');
  return { id: 'disabled' };
};

export const updateTask = async (taskId: string, taskData: Partial<Task>) => {
  console.log('Task service disabled');
  return true;
};

export const deleteTask = async (taskId: string) => {
  console.log('Task service disabled');
  return true;
};

export const moveTask = async (taskId: string, newStatus: Task['status']) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskComment = async (taskId: string, commentText: string, userId: string) => {
  console.log('Task service disabled');
  return { id: 'disabled' };
};

export const deleteTaskComment = async (taskId: string, commentId: string) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskChecklistItem = async (taskId: string, text: string) => {
  console.log('Task service disabled');
  return { id: 'disabled' };
};

export const toggleTaskChecklistItem = async (taskId: string, itemId: string, checked: boolean) => {
  console.log('Task service disabled');
  return true;
};

export const deleteTaskChecklistItem = async (taskId: string, itemId: string) => {
  console.log('Task service disabled');
  return true;
};

export const assignTask = async (taskId: string, userId: string) => {
  console.log('Task service disabled');
  return true;
};

export const addTaskTag = async (taskId: string, tag: string) => {
  console.log('Task service disabled');
  return true;
};

export const removeTaskTag = async (taskId: string, tag: string) => {
  console.log('Task service disabled');
  return true;
};

export const uploadTaskPhoto = async (taskId: string, photoDataUrl: string, userId: string) => {
  console.log('Task service disabled');
  return true;
};

export const approveTaskPhoto = async (taskId: string, adminId: string) => {
  console.log('Task service disabled');
  return true;
};

export const rejectTaskPhoto = async (taskId: string, adminId: string) => {
  console.log('Task service disabled');
  return true;
};

export const deleteAllTasks = async () => {
  console.log('Task service disabled');
  return true;
};

export const cleanupDeletedTasks = async () => {
  console.log('Task service disabled');
  return true;
}; 