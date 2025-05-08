export const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
  };
  
  export const formatDateForApi = (date) => {
    return new Date(date).toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  