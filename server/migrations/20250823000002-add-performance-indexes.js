"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add indexes for better query performance on foreign keys

    // 1. Index on Hostels.ownerId for owner-hostel lookups (only if column exists)
    const tableInfo = await queryInterface.describeTable("Hostels");
    if (tableInfo.ownerId) {
      await queryInterface.addIndex("Hostels", ["ownerId"], {
        name: "hostels_owner_id_index",
      });
    }

    // 2. Index on Users.hostelId for hostel-user lookups
    await queryInterface.addIndex("Users", ["hostelId"], {
      name: "users_hostel_id_index",
    });

    // 3. Composite index on Users(role, hostelId) for role-based queries within hostels
    await queryInterface.addIndex("Users", ["role", "hostelId"], {
      name: "users_role_hostel_id_index",
    });

    // 4. Index on Hostels.subdomain for subdomain lookups (critical for URL-based routing)
    await queryInterface.addIndex("Hostels", ["subdomain"], {
      name: "hostels_subdomain_index",
      unique: true, // Ensure subdomain uniqueness
    });

    // 5. Index on Hostels.isActive for filtering active hostels
    await queryInterface.addIndex("Hostels", ["isActive"], {
      name: "hostels_is_active_index",
    });

    // 6. Composite index on Complaints(hostelId, status) for admin dashboard queries
    await queryInterface.addIndex("Complaints", ["hostelId", "status"], {
      name: "complaints_hostel_id_status_index",
    });

    // 7. Composite index on VisitorLogs(hostelId, checkIn) for visitor analytics
    await queryInterface.addIndex("VisitorLogs", ["hostelId", "checkIn"], {
      name: "visitor_logs_hostel_id_checkin_index",
    });

    // 8. Index on RoomAllocations(hostelId, status) for active allocation queries
    await queryInterface.addIndex("RoomAllocations", ["hostelId", "status"], {
      name: "room_allocations_hostel_id_status_index",
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove all indexes in reverse order
    await queryInterface.removeIndex(
      "RoomAllocations",
      "room_allocations_hostel_id_status_index"
    );
    await queryInterface.removeIndex(
      "VisitorLogs",
      "visitor_logs_hostel_id_checkin_index"
    );
    await queryInterface.removeIndex(
      "Complaints",
      "complaints_hostel_id_status_index"
    );
    await queryInterface.removeIndex("Hostels", "hostels_is_active_index");
    await queryInterface.removeIndex("Hostels", "hostels_subdomain_index");
    await queryInterface.removeIndex("Users", "users_role_hostel_id_index");
    await queryInterface.removeIndex("Users", "users_hostel_id_index");

    // Only remove ownerId index if it exists
    try {
      await queryInterface.removeIndex("Hostels", "hostels_owner_id_index");
    } catch (error) {
      console.log("Owner ID index not found, skipping...");
    }
  },
};
