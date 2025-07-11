import { hashPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';

export async function POST(request) {
  const { nombre, email, password, modulo_id } = await request.json();

  if (!email || !email.includes('@') || !password || password.trim().length < 6) {
    return Response.json({ message: 'Datos inválidos' }, { status: 422 });
  }

  const client = await connectToDatabase();
  const db = client.db();

  const existingUser = await db.collection('usuarios').findOne({ email });
  if (existingUser) {
    client.close();
    return Response.json({ message: 'El usuario ya existe' }, { status: 422 });
  }

  const hashedPassword = await hashPassword(password);

  const result = await db.collection('usuarios').insertOne({
    nombre,
    email,
    password_hash: hashedPassword,
    modulo_id,
    created_at: new Date(),
    updated_at: new Date()
  });

  client.close();
  return Response.json({ message: 'Usuario creado!' }, { status: 201 });
}