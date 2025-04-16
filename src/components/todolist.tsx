'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Task, 'id'>),
      }));
      setTasks(tasksData);
    } catch (error) {
      console.error('Firebase Error:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated: { [key: string]: string } = {};
      tasks.forEach((task) => {
        updated[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      preConfirm: () => {
        const input1 = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const input2 = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!input1 || !input2) {
          Swal.showValidationMessage('Semua field wajib diisi!');
          return;
        }
        return [input1, input2];
      },
    });

    if (formValues) {
      setLoading(true);
      try {
        const newTask = {
          text: formValues[0],
          completed: false,
          deadline: formValues[1],
        };
        await addDoc(collection(db, 'tasks'), newTask);
        await fetchTasks();
        Swal.fire('Berhasil!', 'Tugas berhasil ditambahkan.', 'success');
      } catch (error) {
        console.error('Error adding task:', error);
        Swal.fire('Error!', 'Gagal menambahkan tugas.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updated = { ...task, completed: !task.completed };

    try {
      await updateDoc(doc(db, 'tasks', id), { completed: updated.completed });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (error) {
      console.error('Error toggling task:', error);
      Swal.fire('Error!', 'Gagal mengubah status tugas.', 'error');
    }
  };

  const deleteTask = async (id: string) => {
    const confirm = await Swal.fire({
      title: 'Hapus tugas ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks((prev) => prev.filter((task) => task.id !== id));
      Swal.fire('Terhapus!', 'Tugas berhasil dihapus.', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      Swal.fire('Error!', 'Gagal menghapus tugas.', 'error');
    }
  };

  const editTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const deadlineFormatted = new Date(task.deadline).toISOString().slice(0, 16);

    const { value: formValues } = await Swal.fire({
      title: 'Edit tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${task.text}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${deadlineFormatted}">`,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const text = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const deadline = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!text || !deadline) {
          Swal.showValidationMessage('Semua field wajib diisi!');
          return;
        }
        return [text, deadline];
      },
    });

    if (formValues) {
      try {
        await updateDoc(doc(db, 'tasks', id), {
          text: formValues[0],
          deadline: formValues[1],
        });
        await fetchTasks();
        Swal.fire('Berhasil!', 'Tugas berhasil diperbarui.', 'success');
      } catch (error) {
        console.error('Error updating task:', error);
        Swal.fire('Error!', 'Gagal mengubah tugas.', 'error');
      }
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white font-sans flex items-center justify-center py-10 px-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1605902711622-cfb43c44367f')",
      }}
    >
      <div className="backdrop-blur-sm backdrop-brightness-75 w-full max-w-xl p-6 bg-white bg-opacity-10 shadow-2xl rounded-lg border border-white border-opacity-20">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          📈 To-Do List
        </h1>

        <div className="flex justify-center mb-6">
          <button
            onClick={addTask}
            disabled={loading}
            className={`text-white px-6 py-2 rounded shadow-md transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading ? 'Menambahkan...' : 'Tambah Tugas'}
          </button>
        </div>

        <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          <AnimatePresence>
            {tasks.map((task) => {
              const timeLeft = timeRemaining[task.id] || 'Menghitung...';
              const isExpired = timeLeft === 'Waktu habis!';
              const taskColor = task.completed
                ? 'bg-green-600 bg-opacity-70'
                : isExpired
                ? 'bg-red-700 bg-opacity-60'
                : 'bg-yellow-500 bg-opacity-50';

              return (
                <motion.li
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col gap-1 p-3 rounded-lg shadow-sm ${taskColor}`}
                >
                  <div className="flex justify-between items-start">
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer text-lg ${
                        task.completed
                          ? 'line-through text-gray-200'
                          : 'font-semibold text-white'
                      }`}
                    >
                      {task.text}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editTask(task.id)}
                        className="text-white p-1 px-2 rounded bg-blue-500 hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-white p-1 px-2 rounded bg-red-600 hover:bg-red-800 text-sm"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-100">
                    Deadline: {new Date(task.deadline).toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-gray-300">
                    ⏳ {timeLeft}
                  </p>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
