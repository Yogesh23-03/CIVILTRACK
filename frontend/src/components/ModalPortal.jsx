import ReactDOM from 'react-dom';

const ModalPortal = ({ children }) => {
  // Check if modal-root exists, if not create it
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    document.body.appendChild(modalRoot);
  }
  
  return ReactDOM.createPortal(children, modalRoot);
};

export default ModalPortal;