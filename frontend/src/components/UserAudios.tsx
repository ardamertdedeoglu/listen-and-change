import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

interface AudioFile {
  _id: string;
  originalName: string;
  filename: string;
  fileSize: number;
  isProcessed: boolean;
  transcription?: string;
  createdAt: string;
}

const UserAudios: React.FC = () => {
  const { token } = useAuth();
  const [audios, setAudios] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudios = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/audio/my-audios`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setAudios(response.data.audios);
        setError(null);
      } catch (err) {
        console.error("Error fetching audio files:", err);
        setError("Failed to load your audio files. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAudios();
    }
  }, [token]);

  const handleDelete = async (audioId: string) => {
    if (!window.confirm("Are you sure you want to delete this audio file?")) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/audio/${audioId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove the deleted audio from the state
      setAudios(audios.filter((audio) => audio._id !== audioId));
    } catch (err) {
      console.error("Error deleting audio file:", err);
      setError("Failed to delete audio file. Please try again later.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (loading) {
    return <div className="loading">Loading your audio files...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (audios.length === 0) {
    return (
      <div className="no-audios">
        <h2>Your Audio Files</h2>
        <p>You haven't uploaded any audio files yet.</p>
      </div>
    );
  }

  return (
    <div className="user-audios">
      <h2>Your Audio Files</h2>
      <div className="audio-list">
        {audios.map((audio) => (
          <div key={audio._id} className="audio-item">
            <div className="audio-info">
              <h3>{audio.originalName}</h3>
              <p>Size: {formatFileSize(audio.fileSize)}</p>
              <p>
                Uploaded:{" "}
                {formatDistanceToNow(new Date(audio.createdAt), {
                  addSuffix: true,
                })}
              </p>
              {audio.isProcessed && (
                <span className="processed-badge">Processed</span>
              )}
            </div>
            <div className="audio-actions">
              <a
                href={`${process.env.REACT_APP_API_URL}/api/audio/original/${audio._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Download Original
              </a>
              {audio.isProcessed && (
                <a
                  href={`${process.env.REACT_APP_API_URL}/api/audio/processed/${audio._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success"
                >
                  Download Processed
                </a>
              )}
              <button
                onClick={() => handleDelete(audio._id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAudios;
