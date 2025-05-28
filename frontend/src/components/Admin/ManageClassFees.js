import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Chip,
  Fade,
  Zoom,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, isAfter, differenceInDays } from 'date-fns';

const ManageClassFees = () => {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedClass, setEditedClass] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [updateProgress, setUpdateProgress] = useState(0);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when selected class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass._id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/auth/classes');
      setClasses(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/admin/auth/classes/${classId}/students`);
      setStudents(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch students');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    setEditedClass({
      ...classData,
      baseFee: classData.baseFee || 0,
      lateFeePerDay: classData.lateFeePerDay || 0,
      feeDueDate: classData.feeDueDate ? format(new Date(classData.feeDueDate), 'yyyy-MM-dd') : ''
    });
    setEditMode(false);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedClass({
      ...selectedClass,
      baseFee: selectedClass.baseFee || 0,
      lateFeePerDay: selectedClass.lateFeePerDay || 0,
      feeDueDate: selectedClass.feeDueDate ? format(new Date(selectedClass.feeDueDate), 'yyyy-MM-dd') : ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateOverdueFees = (baseFee, lateFeePerDay, dueDate) => {
    if (!dueDate) return baseFee;
    
    const currentDate = new Date();
    const dueDateObj = new Date(dueDate);
    
    if (isAfter(currentDate, dueDateObj)) {
      const daysLate = differenceInDays(currentDate, dueDateObj);
      return baseFee + (daysLate * lateFeePerDay);
    }
    
    return baseFee;
  };

  const handleUpdateClassFee = async () => {
    try {
      setLoading(true);
      setUpdateProgress(0);
      
      // Calculate total amount with overdue fees
      const totalAmount = calculateOverdueFees(
        Number(editedClass.baseFee),
        Number(editedClass.lateFeePerDay),
        editedClass.feeDueDate
      );

      const response = await axios.post('http://localhost:5000/api/admin/auth/class-fee/update', {
        classId: selectedClass._id,
        baseFee: Number(editedClass.baseFee),
        lateFeePerDay: Number(editedClass.lateFeePerDay),
        feeDueDate: editedClass.feeDueDate,
        totalAmount: totalAmount
      });

      // Update local state with the response data
      setSelectedClass(response.data.updatedClass);
      setStudents(response.data.updatedStudents);
      setEditMode(false);
      setSuccess('Class fee settings updated successfully');
      setError(null);
      setUpdateProgress(100);
    } catch (err) {
      console.error('Error updating class fee:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update class fee settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    setConfirmDialog(true);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog(false);
  };

  const handleConfirmDialogConfirm = () => {
    setConfirmDialog(false);
    handleUpdateClassFee();
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (student.feeDetails?.[selectedClass?._id]?.status === filterStatus);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return theme.palette.success.main;
      case 'overdue':
        return theme.palette.error.main;
      case 'pending':
        return theme.palette.warning.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon fontSize="small" />;
      case 'overdue':
        return <WarningIcon fontSize="small" />;
      case 'pending':
        return <ScheduleIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const StatusChip = ({ status }) => (
    <Chip
      icon={getStatusIcon(status)}
      label={status}
      size="small"
      sx={{
        backgroundColor: alpha(getStatusColor(status), 0.1),
        color: getStatusColor(status),
        fontWeight: 'bold',
        '& .MuiChip-icon': {
          color: getStatusColor(status)
        }
      }}
    />
  );

  if (loading && !selectedClass) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ 
          color: 'primary.main', 
          fontWeight: 'bold',
          flex: 1,
          textAlign: 'center'
        }}>
          Manage Class Fees
        </Typography>
      </Box>

      {error && (
        <Fade in={!!error}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {success && (
        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success">
            {success}
          </Alert>
        </Snackbar>
      )}

      <Grid container spacing={3}>
        {/* Class Selection */}
        <Grid item xs={12} md={4}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                color: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <FilterListIcon /> Select Class
              </Typography>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {classes.map((classData) => (
                  <Zoom in={true} key={classData._id}>
                    <Paper
                      sx={{
                        p: 2,
                        mb: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedClass?._id === classData._id ? 
                          alpha(theme.palette.primary.main, 0.1) : 
                          'background.paper',
                        border: selectedClass?._id === classData._id ? 
                          `2px solid ${theme.palette.primary.main}` : 
                          '2px solid transparent',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[4]
                        },
                      }}
                      onClick={() => handleClassSelect(classData)}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {classData.className}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Base Fee: ${classData.baseFee || 0}
                      </Typography>
                    </Paper>
                  </Zoom>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Class Details and Student List */}
        <Grid item xs={12} md={8}>
          {selectedClass ? (
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <EditIcon /> Class Details
                  </Typography>
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Base Fee"
                          name="baseFee"
                          type="number"
                          value={editedClass.baseFee}
                          onChange={handleInputChange}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Late Fee Per Day"
                          name="lateFeePerDay"
                          type="number"
                          value={editedClass.lateFeePerDay}
                          onChange={handleInputChange}
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Fee Due Date"
                          name="feeDueDate"
                          type="date"
                          value={editedClass.feeDueDate}
                          onChange={handleInputChange}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleConfirmUpdate}
                            disabled={loading}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<CancelIcon />}
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Base Fee
                        </Typography>
                        <Typography variant="h6">
                          ${selectedClass.baseFee || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Late Fee Per Day
                        </Typography>
                        <Typography variant="h6">
                          ${selectedClass.lateFeePerDay || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Due Date
                        </Typography>
                        <Typography variant="h6">
                          {selectedClass.feeDueDate ? format(new Date(selectedClass.feeDueDate), 'MMM dd, yyyy') : 'Not set'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={handleEditClick}
                        >
                          Edit Fee Settings
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Student List */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ 
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <SearchIcon /> Student Fee Details
                  </Typography>
                  
                  {/* Search and Filter */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                    <TextField
                      size="small"
                      label="Search Students"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ flexGrow: 1 }}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filterStatus}
                        label="Status"
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="overdue">Overdue</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <TableContainer component={Paper} elevation={2}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Total Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Due Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredStudents.map((student) => {
                          const feeDetails = student.feeDetails?.[selectedClass._id];
                          const totalAmount = calculateOverdueFees(
                            selectedClass.baseFee,
                            selectedClass.lateFeePerDay,
                            feeDetails?.dueDate || selectedClass.feeDueDate
                          );
                          
                          return (
                            <TableRow 
                              key={student._id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                                }
                              }}
                            >
                              <TableCell>{student.studentID}</TableCell>
                              <TableCell>{student.studentName}</TableCell>
                              <TableCell>
                                <Typography
                                  sx={{
                                    color: feeDetails?.status === 'overdue' ? 
                                      theme.palette.error.main : 
                                      theme.palette.text.primary,
                                    fontWeight: 'bold'
                                  }}
                                >
                                  ${totalAmount}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusChip status={feeDetails?.status || 'pending'} />
                              </TableCell>
                              <TableCell>
                                {feeDetails?.dueDate
                                  ? format(new Date(feeDetails.dueDate), 'MMM dd, yyyy')
                                  : selectedClass.feeDueDate
                                  ? format(new Date(selectedClass.feeDueDate), 'MMM dd, yyyy')
                                  : 'Not set'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: 'background.default',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a class to view and manage fee details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={handleConfirmDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Update</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to update the fee settings for {selectedClass?.className}? This will affect all students in this class.
          </Typography>
          {loading && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} />
              <Typography>Updating fee settings...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDialogConfirm}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageClassFees; 