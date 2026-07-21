import os
import psycopg2

db_url = ""
with open('.env', 'r') as f:
    for line in f:
        if line.startswith('DATABASE_URL='):
            db_url = line.strip().split('=', 1)[1].strip('"').strip("'")

if not db_url:
    print("No DATABASE_URL found")
    exit(1)

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

with open('scratch/create_bucket.sql', 'r') as f:
    sql = f.read()

cur.execute(sql)
print("Bucket created and policies applied.")
