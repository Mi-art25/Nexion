import { getSession } from '../../../lib/supabase';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Fetch projects logic
    return res.status(200).json({ projects: [] });
  }

  if (req.method === 'POST') {
    // Create project logic
    return res.status(201).json({ message: 'Project created' });
  }

  if (req.method === 'DELETE') {
    // Delete project logic
    return res.status(200).json({ message: 'Project deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}