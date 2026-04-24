import sqlite3
import json
import os

db_path = os.path.join(os.getcwd(), 'voxkey.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT username, voice_embeddings, keyboard_baseline FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(f"User: {row[0]}")
        print(f"Voice: {row[1][:100] if row[1] else None}...")
        print(f"Key: {row[2][:100] if row[2] else None}...")
        if row[1]:
            try:
                v = json.loads(row[1])
                print(f"Voice Keys: {list(v.keys())}")
            except: pass
        if row[2]:
            try:
                k = json.loads(row[2])
                print(f"Key Keys: {list(k.keys())}")
            except: pass
    conn.close()
