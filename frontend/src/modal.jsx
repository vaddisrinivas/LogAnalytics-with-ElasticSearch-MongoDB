import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Snackbar,
} from "@mui/material";
import Alert from '@mui/material/Alert';

function ImportModal({ open, onClose, setQuery, name }) {
  const [file, setFile] = useState(null);
  const [query, setLocalQuery] = useState(null);
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  const handleDrop = (acceptedFiles) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const content = fileReader.result;
      setFile(acceptedFiles[0]);
      setLocalQuery(content);
    };
    fileReader.readAsText(acceptedFiles[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("submitting", query, file);
    // Simulating form submission behavior
    if (query || file) {
      const parsedQuery = query ? query : file;
      setQuery(parsedQuery);
      setIsSubmitSuccessful(true);
    } else {
      setIsSubmitSuccessful(false);
    }
    setSubmitCount(submitCount + 1);
    resetState();
  };

  const resetState = () => {
    setFile(null);
    setLocalQuery("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSnackbarClose = () => {
    setIsSubmitSuccessful(false);
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: ".json",
    maxFiles: 1,
    onDrop: handleDrop,
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="import-modal-title"
      aria-describedby="import-modal-description"
    >
      <DialogTitle id="import-modal-title">
        {name}
      </DialogTitle>
      <DialogContent id="import-modal-description">
        <form onSubmit={handleSubmit}>
          {/* <div {...getRootProps()}>
            <input {...getInputProps()} />
            <p>Drag and drop a JSON file here, or click to select a file</p>
          </div>
          {file && <p>{file.name}</p>} */}
          <TextField
            multiline
            rows={4}
            fullWidth
            label="Paste JSON here"
            value={query}
            onChange={(e) => setLocalQuery(e.target.value)}
            error={!query}
            helperText={!query && "This field is required"}
          />
          <Button variant="contained" type="submit" disabled={!query && !file}>
            Submit
          </Button>
        </form>
      </DialogContent>
      <Snackbar
        open={isSubmitSuccessful}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          Query imported successfully!
        </Alert>
      </Snackbar>
      <Snackbar
        open={submitCount > 0 && !isSubmitSuccessful}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error">
          Something went wrong. Please try again.
        </Alert>
      </Snackbar>
    </Dialog>
  );
}

export default ImportModal;
