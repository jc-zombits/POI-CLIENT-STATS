import { verifyPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { signJwtToken } from '@/lib/jwt';

export async function POST(request) {
  const { email, password } = await request.json();

  const client = await connectToDatabase();
  const db = client.db();

  const user = await db.collection('usuarios').findOne({ email });
  if (!user) {
    client.close();
    return Response.json({ message: 'Usuario no encontrado' }, { status: 404 });
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    client.close();
    return Response.json({ message: 'Credenciales incorrectas' }, { status: 422 });
  }

  const token = signJwtToken({ userId: user._id, email: user.email });
  const userData = {
    id: user._id,
    nombre: user.nombre,
    email: user.email,
    modulo_id: user.modulo_id
  };

  client.close();
  return Response.json({ token, user: userData }, { status: 200 });
}