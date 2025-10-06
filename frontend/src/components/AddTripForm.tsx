import { useState } from 'react';
import type { FormEvent } from 'react';

interface AddTripFormProps {
  onTripAdd: (name: string) => void;
}

const AddTripForm = ({ onTripAdd }: AddTripFormProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name) return;
    onTripAdd(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <h3>新しい旅行を追加</h3>
      <input
        type="text"
        placeholder="旅行の名前"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">旅行を追加</button>
    </form>
  );
};

export default AddTripForm;