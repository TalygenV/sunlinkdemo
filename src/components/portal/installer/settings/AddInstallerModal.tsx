import React, { useState, useRef } from "react";
import { X } from "lucide-react";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { ref as dbRef, update } from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { auth, db, storage, app, firestore } from "../../../../lib/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
import { ref } from "firebase/database";

interface AddInstallerModalProps {
  onClose: () => void;
}

export const AddInstallerModal: React.FC<AddInstallerModalProps> = ({
  onClose,
}) => {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !companyName || !email || !password || !logoFile) {
      setError("Please fill out all required fields and upload a logo.");
      return;
    }

    try {
      setLoading(true);

      const secondaryApp =
        getApps().find((a: any) => a.name === "Secondary") ||
        initializeApp(app.options as object, "Secondary");
      const secondaryAuth = getAuth(secondaryApp);

      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const uid = user.uid;

      const secondaryStorage = getStorage(secondaryApp);
      const logoRef = storageRef(secondaryStorage, `installers/${uid}/logo`);
      await uploadBytes(logoRef, logoFile);
      const logoUrl = await getDownloadURL(logoRef);

      await setDoc(doc(firestore, "users", uid), {
        name,
        companyName,
        email,
        logo: logoUrl,
        role: "Installer",
        createdAt: serverTimestamp(),
      });

      const secondaryDb = getDatabase(secondaryApp);
      await update(dbRef(secondaryDb, `users/${uid}`), {
        name,
        companyName,
        email,
        logo: logoUrl,
        uid,
        role: "Installer",
      });

      setSuccess(true);

      // Wait for 3 seconds before closing the modal
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error("Failed to add installer:", err);
      setError(err.message || "Failed to add installer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
      <div className="relative w-full max-w-lg bg-black border border-white/10 rounded-xl p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h3 className="text-xl font-medium text-white mb-4">Add Installer</h3>

        {success && (
          <div className="mb-4 p-3 bg-green-800/50 text-green-200 rounded-lg text-sm text-center border border-green-600">
            ✅ Installer created and saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm text-white/70">
              Contact Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/70">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
              placeholder="Acme Solar"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/70">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
              placeholder="installer@example.com"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/70">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-white"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/70">Logo</label>
            <input
              ref={fileInputRef}
              id="logoUpload"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setLogoFile(e.target.files ? e.target.files[0] : null)
              }
              className="hidden"
            />
            <label
              htmlFor="logoUpload"
              className="flex items-center justify-center w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white cursor-pointer hover:bg-white/10"
            >
              {logoFile ? "Change Logo" : "Upload Logo"}
            </label>
            {logoFile && (
              <p className="mt-1 text-xs text-white/60 truncate">
                {logoFile.name}
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="h-6"></div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 disabled:cursor-not-allowed"
          >
            {loading ? "Creating…" : "Create Installer"}
          </button>
        </form>
      </div>
    </div>
  );
};
