
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Grid,Button, Modal, TextField, Menu} from '@mui/material';
import { render } from 'react-dom';
import QueryBuilder from './QueryBuilder/index.jsx';
import { Collapse } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import "@react-awesome-query-builder/mui/css/styles.scss";
import pako from 'pako';
import axios from 'axios';
import { DataGrid } from '@mui/x-data-grid';
import ImportModal from './modal.jsx';
import { MenuItem } from '@mui/base';
import { Box } from '@mui/system';

function reconvert(data) {
  let textData = JSON.stringify(data);
  let compressedData = pako.gzip(textData);
  let encodedData = btoa(String.fromCharCode.apply(null, compressedData));
  let urlEncodedData = encodeURIComponent(encodedData);
  return urlEncodedData;
}

function refreshPage() {
  window.location.reload(false);
}

const baseURL = 'http://localhost:3000/api/v1/logs/';
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getLogs = async (query, page, pageSize) => {
  try {
    const response = await api.get('/', {
      params: { q: query, page:page+1, size:pageSize },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
// Define an async function that takes JSONData as a parameter
async function pushLogs(JSONData) {
  // Declare a variable to store the response
  let response;
  // Use a try/catch block to handle errors
  try {
    // Await the result of the api.post method and assign it to response
    response = await api.post('/', JSONData);
    // Log the response to the console
    console.log(response);
  } catch (error) {
    // Throw the error if any
    throw error;
  }
  // Return the response data
  return response.data;
}


const App = () => {
  const [query, setQuery] = useState('');
  const [tableData, setTableData] = useState([]);
  const [showQuery, setShowQuery] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 25,
    page: 0,
  });
  const [rowCountState, setRowCountState] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [inputValue, setInputValue] = useState(false);
  const [insertModal, setInsertModal] = useState(false);

  const handleInsertModalSubmit = (inputValue) => {
    pushLogs(JSON.parse(inputValue));
    handleCloseInsertModal();
  }
  const handleOpenInsertModal = () => {
    setInsertModal(true);
  }
  const handleCloseInsertModal = () => {
    setInsertModal(false);
  }

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handleSubmitQuery = () => {
    console.log('query', query);
    console.log('reconvert', reconvert(query));
    setIsLoading(true);
    fetchTableData(query, paginationModel.page, paginationModel.pageSize).then((data) => {
      setTableData(data.hits.map(item => {
        const { _source, _id } = item;
        return { ..._source, _id };
      }));
      setShowTable(true);
      showQuery && setShowQuery(false);
      setRowCountState(data.total_hits);
      setIsLoading(false);
    });
  };

  async function fetchTableData(query, page, pageSize) {
    const result = await getLogs(reconvert(query), page, pageSize);
    return result;
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
    fetchTableData(query, newModel.page, newModel.pageSize).then((data) => {
      setTableData(data.hits.map(item => {
        const { _source, _id } = item;
        return { ..._source, _id };
      }));
      setRowCountState(data.total_hits);
    });
  };

  async function handleModalSubmit(inputValue) {
    console.log('inputValue', JSON.parse(inputValue));
    console.log('reconvert', reconvert(inputValue));
    console.log(typeof inputValue);
    setQuery(JSON.parse(inputValue));
    setInputValue(true);
    handleCloseModal();
  };

  // const handleExport = () => {
  //   const url = `${window.location}?q=${reconvert(query)}`;
  //   navigator.clipboard.writeText(url)
  //     .then(() => {
  //       console.log('URL copied to clipboard');
  //     })
  //     .catch((err) => {
  //       console.error('Failed to copy URL to clipboard', err);
  //     });
  // };

  useEffect(() => {
    if (inputValue) {
      handleSubmitQuery();
      inputValue && setInputValue(false);
    }
  }, [query]);


  return (
    <div style={{margin:"1%"}}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Log Analyzer
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography onClick={() => setShowQuery(!showQuery)}>
            Query
            {showQuery ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Typography>
          {!inputValue &&  <Collapse in={showQuery}>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12}>
                  <QueryBuilder setQuery={setQuery}/>
                </Grid>
              </Grid>
              <Grid item xs={12} spacing={2}>
                <Button variant="contained" onClick={handleSubmitQuery}>Submit</Button>          
              </Grid>
            </Collapse>}
        </Grid>
        <Grid item xs={12}>
          <Typography onClick={() => setShowTable(!showTable)}>
            Table
            {showTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Typography>
          <Collapse in={showTable}>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={tableData}
                columns={[
                  { field: 'level', headerName: 'Level', flex: 1 },
                  { field: 'message', headerName: 'Message', flex: 2 },
                  { field: 'resourceId', headerName: 'Resource ID', flex: 1 },
                  { field: 'timestamp', headerName: 'Timestamp', flex: 1 },
                  { field: 'traceId', headerName: 'Trace ID', flex: 1 },
                  { field: 'spanId', headerName: 'Span ID', flex: 1 },
                  { field: 'commit', headerName: 'Commit', flex: 1 },
                ]}
                pagination
                rowCount={rowCountState}
                getRowId={(row) => row._id}
                loading={isLoading}
                pageSizeOptions={[25,50,100,200,500]}
                paginationModel={paginationModel}
                paginationMode="server"
                onPaginationModelChange={handlePaginationModelChange}
              />
            </div>
          </Collapse>
          <Button variant="contained" onClick={handleOpenModal}>Import Elastic Search Query</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={handleOpenInsertModal}>Insert Logs</Button>
          &nbsp;&nbsp;&nbsp;
          <Button variant="contained" onClick={refreshPage}>Reset Page</Button>                        
        </Grid>
      </Grid>
      <ImportModal name="Import Elastic Search Query JSON" open={openModal} onClose={handleCloseModal} setQuery={handleModalSubmit}/>
      <ImportModal name="Insert Log JSON"  open={insertModal} onClose={handleCloseInsertModal} setQuery={handleInsertModalSubmit}/>

    </div>
  );
};

const rootElement = document.getElementById("root");
render(<App />, rootElement);
