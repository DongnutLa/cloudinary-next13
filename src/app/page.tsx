"use client"
import { useState } from 'react';
import styles from './page.module.css'

export default function Home() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: any) => {
    try {
      e.preventDefault();
      const formData = new FormData();

      // @ts-ignore
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const { url } = await res.json();
      setFileUrl(url);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <main className={styles.main}>
      <form className="bg-white border border-slate-200 dark:border-slate-500 rounded p-6 mb-6" onSubmit={handleSubmit}>
        <p className="mb-6">
          <label htmlFor="image" className="block font-semibold text-sm mb-2">
            Select an Image to Upload
          </label>
          <input type='file' name='file' onChange={handleFileChange} />
        </p>
        <button>Submit</button>
      </form>
      {fileUrl && (
        <>
          <p><img src={ fileUrl } alt="Uploaded image" /></p>
          <p>{ fileUrl }</p>
        </>
      )}
    </main>
  )
}
