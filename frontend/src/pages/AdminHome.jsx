import React from 'react';
import { Link } from 'react-router-dom';

function AdminHome() {
    return (
        <div className="container">
            <div className="row">
                <div className="col-12 text-center mb-5">
                    <h1 className="display-4">Admin Panel</h1>
                    <p className="lead text-muted">Manage your recipe sharing platform</p>
                </div>
            </div>

            {/* Main Management Cards */}
            <div className="row g-4 mb-4">
                {/* Manage Users Card */}
                <div className="col-md-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body text-center p-5">
                            <h2 className="mb-3">Manage Users</h2>
                            <p className="text-muted mb-4">View and delete user accounts</p>
                            <Link to="/admin/users" className="btn btn-primary btn-lg">
                                Go to Users
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Manage Recipes Card */}
                <div className="col-md-6">
                    <div className="card h-100 shadow-sm">
                        <div className="card-body text-center p-5">
                            <h2 className="mb-3">Manage Recipes</h2>
                            <p className="text-muted mb-4">View and delete recipes from all users</p>
                            <Link to="/admin/recipes" className="btn btn-success btn-lg">
                                Go to Recipes
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminHome;