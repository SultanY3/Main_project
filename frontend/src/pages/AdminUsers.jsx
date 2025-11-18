import { useEffect, useState } from "react";
import api from "../api";
import { toast } from "react-toastify"; 

function AdminUsers() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        api.get("admin-dashboard/users/")
           .then(res => setUsers(res.data))
           .catch(err => {
               console.error(err);
               toast.error("Failed to fetch users.");
           });
    };

    const handleDelete = async (id, username) => {
        if (window.confirm(`Are you sure you want to delete ${username}? This will delete all their recipes.`)) {
            try {
                await api.delete(`admin-dashboard/users/${id}/`);
                setUsers(users.filter(u => u.id !== id));
                toast.success(`User ${username} deleted successfully.`);
            } catch (err) {
                toast.error("Failed to delete user.");
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>User Management</h2>
            <table className="table table-striped mt-3">
                {/* ✅ FIX: Use Brand Color instead of table-dark */}
                <thead className="text-white" style={{ backgroundColor: 'var(--brand-color)' }}>
                    <tr style={{ backgroundColor: 'inherit' }}> {/* Ensure row inherits color */}
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Username</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Email</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Joined</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Recipes</th>
                        <th style={{ backgroundColor: 'inherit', color: 'white' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                            <td>{user.recipe_count}</td>
                            <td>
                                <button className="btn btn-danger btn-sm" 
                                        onClick={() => handleDelete(user.id, user.username)}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminUsers;