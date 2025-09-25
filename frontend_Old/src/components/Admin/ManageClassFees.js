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
  alpha,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Save as SaveIcon, 
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Generate as GenerateIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarIcon,
  MonetizationOn as MoneyIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { parseDate, formatDate, isAfter, isBefore, isSameDay } from '../../utils/dateUtils';

// feeDetails is a plain JS object: { [classId]: { ...fee info } }
// Always access as student.feeDetails[classId]

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
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState(0);
  const [feeHistory, setFeeHistory] = useState([]);
  const [feeStats, setFeeStats] = useState(null);
  const [showFeeHistory, setShowFeeHistory] = useState(false);
  const [showFeeStats, setShowFeeStats] = useState(false);
  const [generateFeeDialog, setGenerateFeeDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [enhancedFeeSettings, setEnhancedFeeSettings] = useState({
    monthlyFeeCalculation: 'baseFee',
    customMonthlyFee: 0,
    feeFrequency: 'monthly',
    gracePeriod: 5,
    autoGenerateFees: true
  });
  
  // Add state for month/year filter in fee history
  const [historyMonth, setHistoryMonth] = useState('');
  const [historyYear, setHistoryYear] = useState('');

  // Add state for monthly fee records
  const [recordsMonth, setRecordsMonth] = useState('');
  const [recordsYear, setRecordsYear] = useState(new Date().getFullYear());
  const [monthlyFeeRecords, setMonthlyFeeRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  // Add state for payment history
  const [paymentMonth, setPaymentMonth] = useState('');
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear());
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch classes on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  // Fetch students when selected class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass._id);
      fetchFeeHistory(selectedClass._id);
      fetchFeeStats(selectedClass._id);
    }
  }, [selectedClass]);

  // Fetch monthly fee records when class/month/year changes
  useEffect(() => {
    if (selectedClass && recordsMonth && recordsYear) {
      fetchMonthlyFeeRecords(selectedClass._id, recordsMonth, recordsYear);
    } else {
      setMonthlyFeeRecords([]);
    }
  }, [selectedClass, recordsMonth, recordsYear]);

  // Fetch payment history when class/month/year changes
  useEffect(() => {
    if (selectedClass && paymentMonth && paymentYear) {
      fetchPaymentHistory(selectedClass._id, paymentMonth, paymentYear);
    } else {
      setPaymentHistory([]);
    }
  }, [selectedClass, paymentMonth, paymentYear]);

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

  const fetchFeeHistory = async (classId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/fees/class/${classId}/fee-history`);
      setFeeHistory(response.data.feeHistory || []);
    } catch (err) {
      console.error('Error fetching fee history:', err);
    }
  };

  const fetchFeeStats = async (classId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/fees/comprehensive-stats?classId=${classId}`);
      setFeeStats(response.data.data);
    } catch (err) {
      console.error('Error fetching fee stats:', err);
    }
  };

  const fetchMonthlyFeeRecords = async (classId, month, year) => {
    try {
      setRecordsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/fees/class/${classId}/records?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMonthlyFeeRecords(response.data.data || []);
    } catch (err) {
      setMonthlyFeeRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const fetchPaymentHistory = async (classId, month, year) => {
    try {
      setPaymentLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/fees/class/${classId}/payment-history?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Debug: Log the API response
      console.log('Payment history API response:', response.data);
      setPaymentHistory(response.data.data || []);
    } catch (err) {
      setPaymentHistory([]);
      // Debug: Log the error
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history. Please check your network or try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    setEditedClass({
      ...classData,
      baseFee: classData.baseFee || 0,
      lateFeePerDay: classData.lateFeePerDay || 0,
      feeDueDate: classData.feeDueDate ? formatDate(classData.feeDueDate) : ''
    });
    
    // Set enhanced fee settings
    if (classData.feeSettings) {
      setEnhancedFeeSettings({
        ...enhancedFeeSettings,
        ...classData.feeSettings
      });
    }
    
    setEditMode(false);
    setActiveTab(0);
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
      feeDueDate: selectedClass.feeDueDate ? formatDate(selectedClass.feeDueDate) : ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEnhancedSettingChange = (setting, value) => {
    setEnhancedFeeSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleUpdateClassFee = async () => {
    try {
      setLoading(true);
      setUpdateProgress(0);
      
      const response = await axios.post('http://localhost:5000/api/admin/auth/class-fee/update', {
        classId: selectedClass._id,
        baseFee: Number(editedClass.baseFee),
        lateFeePerDay: Number(editedClass.lateFeePerDay),
        feeDueDate: editedClass.feeDueDate,
        totalAmount: 0,
        reason: 'Fee settings updated by admin',
        feeSettings: enhancedFeeSettings
      });

      // Update local state with the response data
      setSelectedClass(response.data.updatedClass);
      setStudents(response.data.updatedStudents);
      setEditMode(false);
      setSuccess('Class fee settings updated successfully');
      setError(null);
      setUpdateProgress(100);
      
      // Refresh fee history and stats
      fetchFeeHistory(selectedClass._id);
      fetchFeeStats(selectedClass._id);
    } catch (err) {
      console.error('Error updating class fee:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to update class fee settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthlyFees = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/fees/generate-monthly-fees', {
        classId: selectedClass._id,
        month: selectedMonth,
        year: selectedYear
      });

      setSuccess(`Generated ${response.data.generatedCount} monthly fees successfully`);
      setGenerateFeeDialog(false);
      fetchStudents(selectedClass._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate monthly fees');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

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

  const StatusChip = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'paid':
          return 'success';
        case 'pending':
          return 'warning';
        case 'overdue':
          return 'error';
        case 'under_process':
          return 'info';
        case 'cancelled':
          return 'default';
        default:
          return 'default';
      }
    };

    return (
      <Chip
        label={status?.toUpperCase() || 'PENDING'}
        color={getStatusColor()}
        size="small"
        variant="outlined"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        color: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        mb: 3
      }}>
        <MoneyIcon /> Enhanced Fee Management System
      </Typography>

      {/* Success/Error Messages */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

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
                      {classData.feeSettings?.autoGenerateFees && (
                        <Chip 
                          label="Auto Generate" 
                          size="small" 
                          color="success" 
                          sx={{ mt: 1 }}
                        />
                      )}
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
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Fee Management" icon={<MoneyIcon />} />
                    <Tab label="Fee History" icon={<HistoryIcon />} />
                    <Tab label="Statistics" icon={<TrendingUpIcon />} />
                    <Tab label="Settings" icon={<SettingsIcon />} />
                  </Tabs>
                </Box>

                {/* Tab 1: Fee Management */}
                {activeTab === 0 && (
                  <Box>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <EditIcon /> Fee Settings for {selectedClass.className}
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
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Due Date"
                              name="feeDueDate"
                              type="date"
                              value={editedClass.feeDueDate}
                              onChange={handleInputChange}
                              InputLabelProps={{
                                shrink: true,
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<GenerateIcon />}
                              onClick={() => setGenerateFeeDialog(true)}
                              fullWidth
                            >
                              Generate Monthly Fees
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<SaveIcon />}
                                onClick={handleConfirmUpdate}
                                disabled={loading}
                              >
                                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                              </Button>
                              <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelEdit}
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
                              {selectedClass.feeDueDate ? formatDate(selectedClass.feeDueDate) : 'Not set'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={handleEditClick}
                              >
                                Edit Fee Settings
                              </Button>
                              <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<GenerateIcon />}
                                onClick={() => setGenerateFeeDialog(true)}
                              >
                                Generate Monthly Fees
                              </Button>
                            </Box>
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
                            <MenuItem value="under_process">Under Process</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Student ID</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Monthly Fee</TableCell>
                              <TableCell>Total Amount</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Due Date</TableCell>
                              <TableCell>Last Updated</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredStudents.map((student) => {
                              const feeDetails = student.feeDetails?.[selectedClass._id];
                              
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
                                    <Typography variant="body2">
                                      ${feeDetails?.monthlyFee || (selectedClass.baseFee / 12)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography
                                      sx={{
                                        color: feeDetails?.status === 'overdue' ? 
                                          theme.palette.error.main : 
                                          theme.palette.text.primary,
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      ${feeDetails?.totalAmount || 0}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <StatusChip status={feeDetails?.status || 'pending'} />
                                  </TableCell>
                                  <TableCell>
                                    {feeDetails?.dueDate
                                      ? formatDate(feeDetails.dueDate)
                                      : selectedClass.feeDueDate
                                      ? formatDate(selectedClass.feeDueDate)
                                      : 'Not set'}
                                  </TableCell>
                                  <TableCell>
                                    {feeDetails?.lastUpdated
                                      ? formatDate(feeDetails.lastUpdated)
                                      : 'Never'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Box>
                )}

                {/* Tab 2: Fee History */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <HistoryIcon /> Fee History for {selectedClass.className}
                    </Typography>
                    {/* Month/Year Filter */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={historyMonth}
                          label="Month"
                          onChange={e => setHistoryMonth(e.target.value)}
                        >
                          <MenuItem value="">All Months</MenuItem>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, idx) => (
                            <MenuItem key={m} value={idx+1}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={historyYear}
                          label="Year"
                          onChange={e => setHistoryYear(e.target.value)}
                        >
                          <MenuItem value="">All Years</MenuItem>
                          {Array.from(new Set((feeHistory||[]).map(h=>h.updatedAt ? new Date(h.updatedAt).getFullYear() : null).filter(Boolean))).map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">Fee Change History</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {feeHistory.filter(history => {
                            const month = history.updatedAt ? new Date(history.updatedAt).getMonth()+1 : null;
                            const year = history.updatedAt ? new Date(history.updatedAt).getFullYear() : null;
                            const matchMonth = historyMonth ? String(month) === String(historyMonth) : true;
                            const matchYear = historyYear ? String(year) === String(historyYear) : true;
                            return matchMonth && matchYear;
                          }).map((history, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CalendarIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={`Base Fee: $${history.baseFee} | Late Fee: $${history.lateFeePerDay}/day`}
                                secondary={`Updated on ${formatDate(history.updatedAt)} by ${history.updatedBy?.adminName || 'Admin'}${history.reason ? ` - ${history.reason}` : ''}`}
                              />
                            </ListItem>
                          ))}
                          {feeHistory.filter(history => {
                            const month = history.updatedAt ? new Date(history.updatedAt).getMonth()+1 : null;
                            const year = history.updatedAt ? new Date(history.updatedAt).getFullYear() : null;
                            const matchMonth = historyMonth ? String(month) === String(historyMonth) : true;
                            const matchYear = historyYear ? String(year) === String(historyYear) : true;
                            return matchMonth && matchYear;
                          }).length === 0 && (
                            <ListItem>
                              <ListItemText primary="No fee history for selected month/year" />
                            </ListItem>
                          )}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}

                {/* Tab 3: Statistics */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <TrendingUpIcon /> Fee Statistics for {selectedClass.className}
                    </Typography>
                    
                    {feeStats && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="primary">
                              {feeStats.overview?.totalFees || 0}
                            </Typography>
                            <Typography variant="body2">Total Fees</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="success.main">
                              {feeStats.overview?.paidFees || 0}
                            </Typography>
                            <Typography variant="body2">Paid Fees</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="warning.main">
                              {feeStats.overview?.pendingFees || 0}
                            </Typography>
                            <Typography variant="body2">Pending Fees</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2 }}>
                            <Typography variant="h4" color="error.main">
                              {feeStats.overview?.overdueFees || 0}
                            </Typography>
                            <Typography variant="body2">Overdue Fees</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12}>
                          <Card sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Collection Rate</Typography>
                            <Typography variant="h4" color="primary">
                              {feeStats.overview?.collectionRate?.toFixed(1) || 0}%
                            </Typography>
                          </Card>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                )}

                {/* Tab 4: Settings */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ 
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <SettingsIcon /> Fee Settings for {selectedClass.className}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Monthly Fee Calculation</InputLabel>
                          <Select
                            value={enhancedFeeSettings.monthlyFeeCalculation}
                            label="Monthly Fee Calculation"
                            onChange={(e) => handleEnhancedSettingChange('monthlyFeeCalculation', e.target.value)}
                          >
                            <MenuItem value="baseFee">Based on Base Fee (Base Fee / 12)</MenuItem>
                            <MenuItem value="custom">Custom Monthly Fee</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      {enhancedFeeSettings.monthlyFeeCalculation === 'custom' && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Custom Monthly Fee"
                            type="number"
                            value={enhancedFeeSettings.customMonthlyFee}
                            onChange={(e) => handleEnhancedSettingChange('customMonthlyFee', Number(e.target.value))}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
                            }}
                          />
                        </Grid>
                      )}
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Fee Frequency</InputLabel>
                          <Select
                            value={enhancedFeeSettings.feeFrequency}
                            label="Fee Frequency"
                            onChange={(e) => handleEnhancedSettingChange('feeFrequency', e.target.value)}
                          >
                            <MenuItem value="monthly">Monthly</MenuItem>
                            <MenuItem value="quarterly">Quarterly</MenuItem>
                            <MenuItem value="annually">Annually</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Grace Period (Days)"
                          type="number"
                          value={enhancedFeeSettings.gracePeriod}
                          onChange={(e) => handleEnhancedSettingChange('gracePeriod', Number(e.target.value))}
                          inputProps={{ min: 0, max: 30 }}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={enhancedFeeSettings.autoGenerateFees}
                              onChange={(e) => handleEnhancedSettingChange('autoGenerateFees', e.target.checked)}
                            />
                          }
                          label="Auto-generate monthly fees"
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleConfirmUpdate}
                          disabled={loading}
                        >
                          Save Settings
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Monthly Fee Records */}
                {selectedClass && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon /> Monthly Fee Records
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={recordsMonth}
                          label="Month"
                          onChange={e => setRecordsMonth(e.target.value)}
                        >
                          <MenuItem value="">Select Month</MenuItem>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, idx) => (
                            <MenuItem key={m} value={idx+1}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={recordsYear}
                          label="Year"
                          onChange={e => setRecordsYear(e.target.value)}
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Payment Date</TableCell>
                            <TableCell>Late Fee</TableCell>
                            <TableCell>Receipt/Transaction</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recordsLoading ? (
                            <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                          ) : monthlyFeeRecords.length === 0 ? (
                            <TableRow><TableCell colSpan={8} align="center">No records found for selected month/year</TableCell></TableRow>
                          ) : (
                            monthlyFeeRecords.map((rec, idx) => (
                              <TableRow key={rec._id || idx}>
                                <TableCell>{rec.student?.studentID}</TableCell>
                                <TableCell>{rec.student?.studentName}</TableCell>
                                <TableCell>${rec.totalAmount}</TableCell>
                                <TableCell>{rec.status}</TableCell>
                                <TableCell>{rec.dueDate ? formatDate(rec.dueDate) : ''}</TableCell>
                                <TableCell>{rec.paymentDate ? formatDate(rec.paymentDate) : '-'}</TableCell>
                                <TableCell>${rec.lateFeeAmount || 0}</TableCell>
                                <TableCell>{rec.receiptNumber || rec.transactionId || '-'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Payment History */}
                {selectedClass && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon /> Payment History (Parent Payments)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Month</InputLabel>
                        <Select
                          value={paymentMonth}
                          label="Month"
                          onChange={e => setPaymentMonth(e.target.value)}
                        >
                          <MenuItem value="">Select Month</MenuItem>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, idx) => (
                            <MenuItem key={m} value={idx+1}>{m}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                          value={paymentYear}
                          label="Year"
                          onChange={e => setPaymentYear(e.target.value)}
                        >
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                            <MenuItem key={y} value={y}>{y}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {error && (
                      <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main', mb: 2 }}>
                        {error}
                      </Paper>
                    )}
                    {(!paymentMonth || !paymentYear) ? (
                      <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Please select a month and year to view payment history.
                      </Paper>
                    ) : paymentLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 100 }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : paymentHistory.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        No payments found for selected month/year.
                      </Paper>
                    ) : (
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Student ID</TableCell>
                              <TableCell>Name</TableCell>
                              <TableCell>Amount Paid</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Payment Date</TableCell>
                              <TableCell>Payment Method</TableCell>
                              <TableCell>Transaction/Receipt</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentHistory.map((rec, idx) => (
                              <TableRow key={rec._id || idx}>
                                <TableCell>{rec.student?.studentID || '-'}</TableCell>
                                <TableCell>{rec.student?.studentName || '-'}</TableCell>
                                <TableCell>{rec.totalAmount !== undefined ? `$${rec.totalAmount}` : '-'}</TableCell>
                                <TableCell>{rec.status || '-'}</TableCell>
                                <TableCell>{rec.paymentDate ? formatDate(rec.paymentDate) : '-'}</TableCell>
                                <TableCell>{rec.paymentMethod || '-'}</TableCell>
                                <TableCell>{rec.receiptNumber || rec.transactionId || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
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

      {/* Generate Monthly Fees Dialog */}
      <Dialog
        open={generateFeeDialog}
        onClose={() => setGenerateFeeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Generate Monthly Fees</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateFeeDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleGenerateMonthlyFees}
            color="primary"
            variant="contained"
            disabled={!selectedMonth || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Generate Fees'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageClassFees; 