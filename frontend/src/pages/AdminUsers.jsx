import { useEffect, useState } from "react";
import api from "../api";

function AdminUsers() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        api.get("admin-dashboard/users/")
           .then(res => setUsers(res.data))
           .catch(err => console.error(err));
    };

    const handleDelete = async (id, username) => {
        if (window.confirm(`Are you sure you want to delete ${username}? This will delete all their recipes.`)) {
            try {
                await api.delete(`admin-dashboard/users/${id}/`);
                setUsers(users.filter(u => u.id !== id));
            } catch (err) {
                alert("Failed to delete user.");
            }
        }
    };

    return (
        <div className="container mt-4">
            <h2>User Management</h2>
            <table className="table table-striped mt-3">
                <thead className="table-dark">
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Joined</th>
                        <th>Recipes</th>
                        <th>Actions</th>
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