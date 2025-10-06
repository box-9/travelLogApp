import { useState } from 'react';
import type { FormEvent } from 'react';

interface AddLocationFormProps {
    onLocationAdd: (formData: {title: string, description: string, file: File}) => void;
}

const AddLocationForm = ({ onLocationAdd }: AddLocationFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
        alert("写真を選択して下さい。");
        return;
    }

    onLocationAdd({ title, description, file });
    setTitle('');
    setDescription('');
    setFile(null);
    e.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <h3>場所を追加</h3>
      <input type="text" placeholder="場所の名前" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <textarea placeholder="詳細" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="file" onChange={handleFileChange} required accept='image/jpeg, image/png' />
      <button type="submit">場所を追加</button>
    </form>
  );
};

export default AddLocationForm;