import React from "react";

const Dashboard = () => {

  return (
    <div>

      <h2>Dashboard</h2>

      <div className="row">

        <div className="col-md-3">
          <div className="card p-3">
            Total Items
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            Business Partners
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            Sales Orders
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;