import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'voxkey.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET voice_embeddings = NULL, voice_header = NULL WHERE username = 'Rahma'")
    print(f"Reset voice profile for Rahma. Rows affected: {cursor.rowcount}")
    conn.commit()
    conn.close()
else:
    print("Database not found")
