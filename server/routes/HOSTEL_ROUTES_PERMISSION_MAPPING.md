# 🏢 Hostel Routes Permission Mapping

## 📊 **Overview**

This document provides a comprehensive mapping of all hostel routes to their corresponding permissions. The routes have been updated to use the new permission-based middleware system while maintaining backward compatibility and proper access control.

---

## 🔐 **Permission-Based Route Protection**

### **Base Hostel Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels` | GET | `view_hostel` | Get all hostels user has access to |
| `/api/hostels` | POST | `manage_hostel` | Create a new hostel |

### **Hostel-Specific Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId` | GET | `view_hostel` | Get specific hostel details |
| `/api/hostels/:hostelId` | PUT | `manage_hostel` | Update hostel details |
| `/api/hostels/:hostelId` | DELETE | `manage_hostel` | Delete hostel and all related data |

### **Dashboard Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/dashboard` | GET | `view_hostel_stats` | Get dashboard metrics for hostel |
| `/api/hostels/:hostelId/stats` | GET | `view_hostel_stats` | Get detailed stats for hostel |

---

## 👥 **Visitor Management Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/visitors` | GET | `view_visitors` | Get all visitors for hostel |
| `/api/hostels/:hostelId/visitors` | POST | `create_visitors` | Create new visitor log |
| `/api/hostels/:hostelId/visitors/:visitorId` | PUT | `manage_visitors` | Update visitor log |
| `/api/hostels/:hostelId/visitors/:visitorId` | DELETE | `manage_visitors` | Delete visitor log |
| `/api/hostels/:hostelId/visitors/:visitorId/checkout` | POST | `checkout_visitors` | Checkout visitor |

---

## 🎓 **Student Management Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/students` | GET | `view_students` | Get all students for hostel |
| `/api/hostels/:hostelId/students` | POST | `manage_students` | Create new student |
| `/api/hostels/:hostelId/students/:studentId` | PUT | `manage_students` | Update student |
| `/api/hostels/:hostelId/students/:studentId` | DELETE | `manage_students` | Delete student |

---

## 📝 **Complaint Management Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/complaints` | GET | `view_complaints` | Get all complaints for hostel |
| `/api/hostels/:hostelId/complaints` | POST | `create_complaints` | Create new complaint |
| `/api/hostels/:hostelId/complaints/:complaintId/resolve` | POST | `handle_complaints` | Resolve complaint |
| `/api/hostels/:hostelId/complaints/:complaintId/status` | PUT | `handle_complaints` | Update complaint status and priority |
| `/api/hostels/:hostelId/complaints/:complaintId` | DELETE | `delete_complaints` | Delete complaint |

---

## 🏠 **Room Management Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/rooms` | GET | `view_rooms` | Get all rooms for hostel |
| `/api/hostels/:hostelId/rooms` | POST | `manage_rooms` | Create new room |
| `/api/hostels/:hostelId/rooms/:roomId` | PUT | `manage_rooms` | Update room |
| `/api/hostels/:hostelId/rooms/:roomId` | DELETE | `manage_rooms` | Delete room |
| `/api/hostels/:hostelId/rooms/:roomId/students` | GET | `view_room_allocations` | Get all students in a specific room |

---

## 🏠 **Room Allocation Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/room-allocations` | POST | `allocate_rooms` | Allocate room to student |
| `/api/hostels/:hostelId/room-allocations/:allocationId` | DELETE | `deallocate_rooms` | Deallocate room from student |

---

## 🛡️ **Warden Management Routes**

| Route | Method | Permission Required | Description |
|-------|--------|-------------------|-------------|
| `/api/hostels/:hostelId/wardens` | GET | `view_wardens` | Get all wardens for hostel |
| `/api/hostels/:hostelId/wardens` | POST | `manage_wardens` | Create new warden |
| `/api/hostels/:hostelId/wardens/:wardenId` | PUT | `manage_wardens` | Update warden |
| `/api/hostels/:hostelId/wardens/:wardenId` | DELETE | `manage_wardens` | Delete warden |

---

## 🔄 **Migration from Role-Based to Permission-Based**

### **Before (Role-Based)**
```javascript
// Old role-based middleware
router.get('/:hostelId/rooms', requireHostelRole('owner', 'warden'), adminController.getAllRooms);
router.post('/:hostelId/students', requireHostelRole('owner', 'warden'), adminController.createStudent);
router.get('/:hostelId/wardens', requireHostelOwner, adminController.getAllWardens);
```

### **After (Permission-Based)**
```javascript
// New permission-based middleware
router.get('/:hostelId/rooms', requirePermission('view_rooms'), adminController.getAllRooms);
router.post('/:hostelId/students', requirePermission('manage_students'), adminController.createStudent);
router.get('/:hostelId/wardens', requirePermission('view_wardens'), adminController.getAllWardens);
```

---

## 🎯 **Permission Distribution by Role**

### **Owner Role**
- ✅ **All 40 permissions** - Full access to all hostel operations
- ✅ **Hostel Management** - `manage_hostel`, `view_hostel`, `view_hostel_stats`
- ✅ **Student Management** - `manage_students`, `view_students`, `manage_student_rooms`
- ✅ **Room Management** - `manage_rooms`, `view_rooms`, `allocate_rooms`, `deallocate_rooms`
- ✅ **Warden Management** - `manage_wardens`, `view_wardens`, `assign_warden_roles`
- ✅ **Complaint Management** - `handle_complaints`, `view_complaints`, `delete_complaints`
- ✅ **Visitor Management** - `manage_visitors`, `view_visitors`, `checkout_visitors`
- ✅ **Reports & Analytics** - `view_reports`, `export_data`, `view_analytics`

### **Warden Role**
- ✅ **22 permissions** - Hostel management operations
- ✅ **Student Management** - `view_students`, `manage_student_rooms`, `view_student_rooms`
- ✅ **Room Management** - `manage_rooms`, `view_rooms`, `allocate_rooms`, `deallocate_rooms`
- ✅ **Complaint Management** - `handle_complaints`, `view_complaints`
- ✅ **Visitor Management** - `view_visitors`, `manage_visitors`, `checkout_visitors`
- ✅ **Reports & Analytics** - `view_reports`, `view_analytics`
- ❌ **Warden Management** - No access to manage other wardens
- ❌ **Hostel Settings** - No access to hostel configuration

### **Student Role**
- ✅ **8 permissions** - Basic user operations
- ✅ **Profile Management** - `manage_profile`, `view_profile`, `change_password`
- ✅ **Own Data Access** - `view_own_data`
- ✅ **Complaint Management** - `create_complaints`, `view_complaints`
- ✅ **Visitor Management** - `create_visitors`, `view_visitors`
- ❌ **Hostel Management** - No access to hostel operations
- ❌ **Student Management** - No access to other students
- ❌ **Room Management** - No access to room operations

### **Superadmin Role**
- ✅ **All 40 permissions** - System-wide access
- ✅ **System Administration** - `manage_system`, `manage_all_hostels`, `view_system_stats`
- ✅ **Billing Management** - `manage_billing`, `view_billing`
- ✅ **Owner Management** - `manage_owners`
- ✅ **All Hostel Operations** - Full access to all hostels

---

## 🔧 **Middleware Stack**

### **Route Protection Stack**
```javascript
// Applied to all routes with :hostelId
router.use('/:hostelId', 
  verifyToken,           // 1. Authenticate user
  validateHostelAccess,  // 2. Validate hostel access
  requireHostelAccess,   // 3. Check hostel-specific permissions
  requirePermission('...') // 4. Check specific operation permission
);
```

### **Middleware Order**
1. **`verifyToken`** - Ensures user is authenticated
2. **`validateHostelAccess`** - Validates user has access to the hostel
3. **`requireHostelAccess`** - Checks hostel-specific permissions
4. **`requirePermission`** - Checks specific operation permission

---

## 🛡️ **Security Benefits**

### **Granular Access Control**
- ✅ **Fine-grained permissions** - Each operation has specific permission
- ✅ **Role flexibility** - Custom roles can have specific permission sets
- ✅ **Operation-specific access** - Users can have different permissions for different operations

### **Backward Compatibility**
- ✅ **Legacy role support** - Existing roles continue to work
- ✅ **Gradual migration** - Can migrate routes one by one
- ✅ **No breaking changes** - Existing functionality preserved

### **Enhanced Security**
- ✅ **Permission validation** - Every request validated against permissions
- ✅ **Hostel scoping** - Users can only access their assigned hostels
- ✅ **Audit trail** - All permission checks logged

---

## 📝 **Usage Examples**

### **Basic Route Protection**
```javascript
// Simple permission check
router.get('/:hostelId/rooms', requirePermission('view_rooms'), getRooms);

// Multiple permission options
router.get('/:hostelId/complaints', requireAnyPermission(['handle_complaints', 'view_complaints']), getComplaints);
```

### **Advanced Route Protection**
```javascript
// Combine multiple middleware
router.get('/:hostelId/dashboard', 
  addUserPermissions,                    // Add permissions to request
  requirePermission('view_hostel_stats'), // Check specific permission
  getDashboard
);
```

### **Controller Integration**
```javascript
// In controller, permissions are already validated
exports.getRooms = async (req, res) => {
  try {
    // User already has 'view_rooms' permission due to middleware
    const rooms = await Room.findAll({ where: { hostelId: req.params.hostelId } });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
```

---

## 🔍 **Testing & Validation**

### **Permission Testing**
```javascript
// Test with different user roles
describe('Hostel Routes Permission', () => {
  test('should allow owner to view rooms', async () => {
    const response = await request(app)
      .get('/api/hostels/123/rooms')
      .set('Authorization', 'Bearer owner-token')
      .expect(200);
  });
  
  test('should deny student access to manage rooms', async () => {
    const response = await request(app)
      .post('/api/hostels/123/rooms')
      .set('Authorization', 'Bearer student-token')
      .expect(403);
  });
});
```

### **Permission Validation**
```javascript
// Verify permission mapping
const permissionMap = {
  'view_rooms': ['owner', 'warden'],
  'manage_rooms': ['owner', 'warden'],
  'view_wardens': ['owner'],
  'manage_wardens': ['owner']
};
```

---

## 📚 **Related Documentation**

- `PERMISSION_MIDDLEWARE_DOCUMENTATION.md` - Complete middleware documentation
- `RBAC_SERVICE_DOCUMENTATION.md` - RBAC service layer documentation
- `RBAC_COMPLETE_SUMMARY.md` - Complete RBAC system overview
- `RBAC_API_PERMISSION_VERIFICATION.md` - API permission mapping

**The hostel routes are now fully protected with permission-based access control!** 🚀







