import { useRef, useState } from 'react';
import { Building2, Camera, Check, Mail, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { currentUser, updateAvatar } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!currentUser) return null;

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateAvatar(file);
      setMessage('Profile photo updated successfully.');
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || 'Could not update your profile photo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <section className="profile-panel">
        <div className="profile-panel__header">
          <div>
            <span className="profile-panel__eyebrow">Account identity</span>
            <h1 className="profile-panel__title">Your profile</h1>
            <p className="profile-panel__copy">Manage the identity shown in the SentinelRAG workspace.</p>
          </div>
          <Shield className="h-7 w-7 text-[#FF6A1A]" />
        </div>

        <div className="profile-panel__body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={`${currentUser.full_name} profile`} />
              ) : (
                <User className="h-12 w-12 text-slate-400" />
              )}
            </div>
            <button
              type="button"
              className="profile-avatar__button"
              onClick={() => inputRef.current?.click()}
              disabled={saving}
            >
              <Camera className="h-4 w-4" />
              {saving ? 'Uploading...' : 'Change photo'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                void handlePhotoChange(event.target.files?.[0]);
                event.currentTarget.value = '';
              }}
            />
            <p className="profile-avatar__hint">JPG, PNG, WEBP, or GIF · Max 2 MB</p>
          </div>

          <div className="profile-details">
            <div className="profile-detail">
              <User className="profile-detail__icon" />
              <div className="profile-detail__content">
                <span className="profile-detail__label">Full name</span>
                <span className="profile-detail__value">{currentUser.full_name}</span>
              </div>
            </div>
            <div className="profile-detail">
              <Mail className="profile-detail__icon" />
              <div className="profile-detail__content">
                <span className="profile-detail__label">Email</span>
                <span className="profile-detail__value">{currentUser.email}</span>
              </div>
            </div>
            <div className="profile-detail">
              <Shield className="profile-detail__icon" />
              <div className="profile-detail__content">
                <span className="profile-detail__label">Role</span>
                <span className="profile-detail__value">{currentUser.role}</span>
              </div>
            </div>
            <div className="profile-detail">
              <Building2 className="profile-detail__icon" />
              <div className="profile-detail__content">
                <span className="profile-detail__label">Department</span>
                <span className="profile-detail__value">{currentUser.department}</span>
              </div>
            </div>
          </div>
        </div>

        {(message || error) && (
          <p className={`profile-feedback ${error ? 'profile-feedback--error' : ''}`}>
            {error ? error : <><Check className="inline h-4 w-4" /> {message}</>}
          </p>
        )}
      </section>
    </main>
  );
};
