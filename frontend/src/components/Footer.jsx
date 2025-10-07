

const Footer = () => {
  return (
    <footer className='bg-dark text-white p-2'
    style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      textAlign: 'center',
      zIndex: 1000,
      }}
    >
      &copy; Issue Tracker by Matthew Guelbert 2024
    </footer>
  )
};

export default Footer;