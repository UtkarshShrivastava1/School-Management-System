import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { format } from 'date-fns';

const ViewChildFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChildFees = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/parent/child-fees', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setFees(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch fee details. Please try again later.');
        setLoading(false);
      }
    };

    fetchChildFees();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box m={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Fee Details
      </Typography>
      
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt Number</TableCell>
                <TableCell>Fee Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee._id}>
                  <TableCell>{fee.receiptNumber}</TableCell>
                  <TableCell>{fee.feeType}</TableCell>
                  <TableCell>₹{fee.totalAmount}</TableCell>
                  <TableCell>{format(new Date(fee.dueDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      label={fee.status.toUpperCase()}
                      color={getStatusColor(fee.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {fee.paymentDate
                      ? format(new Date(fee.paymentDate), 'dd/MM/yyyy')
                      : '-'}
                  </TableCell>
                  <TableCell>{fee.paymentMethod || '-'}</TableCell>
                </TableRow>
              ))}
              {fees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No fee records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ViewChildFees; 