import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { uploadTaskPhoto } from '../services/task.service';
import { Task, User } from '../types';

interface PhotoCaptureProps {
  task: Task;
  currentUser: User;
  onPhotoUploaded: () => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ task, currentUser, onPhotoUploaded }) => {
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (capturing && videoRef.current) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        setCapturing(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [capturing]);

  const startCapture = () => {
    setCapturing(true);
    setPhoto(null);
    setError(null);
  };

  const stopCapture = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const photoData = canvas.toDataURL('image/jpeg');
        setPhoto(photoData);
        stopCapture();
      }
    }
  };

  const uploadPhoto = async () => {
    if (!photo) return;

    setUploading(true);
    try {
      await uploadTaskPhoto(task.id, photo, currentUser.id);
      setPhoto(null);
      onPhotoUploaded();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Falha ao enviar a foto. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPhoto = () => {
    setPhoto(null);
  };

  return (
    <div className="mt-4">
      {!capturing && !photo && (
        <button
          onClick={startCapture}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
        >
          <Camera size={18} />
          Tirar Foto para Concluir Tarefa
        </button>
      )}

      {error && (
        <div className="text-red-500 bg-red-100/10 p-3 rounded-lg mt-2">
          {error}
        </div>
      )}

      {capturing && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-auto"
            style={{ maxHeight: '70vh' }}
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={capturePhoto}
              className="p-3 bg-white rounded-full shadow-lg mx-2"
            >
              <span className="block w-12 h-12 rounded-full border-4 border-gray-800" />
            </button>
            
            <button
              onClick={stopCapture}
              className="p-3 bg-red-500 rounded-full shadow-lg mx-2 flex items-center justify-center"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {photo && (
        <div className="mt-4">
          <img src={photo} alt="Captured" className="w-full rounded-lg" />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={uploadPhoto}
              disabled={uploading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white p-2 rounded-lg transition-colors"
            >
              {uploading ? 'Enviando...' : 'Enviar Foto'}
            </button>
            
            <button
              onClick={cancelPhoto}
              disabled={uploading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 text-white p-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCapture; 