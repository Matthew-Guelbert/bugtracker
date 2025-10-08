import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

const UserListItem = ({ item, auth }) => {
  const fullName = `${item.givenName} ${item.familyName}`;
  const isAdmin = auth.role.includes('Admin');
  const isTechnicalManager = auth.role.includes('Technical Manager');

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{fullName}</h5>
        <p>{item.role}</p>
        <Link to={`/users/${item._id}`} className='btn btn-secondary'>
          View User
        </Link>
        {(isAdmin || isTechnicalManager) && (
          <Link to={`/users/${item._id}/edit`} className='btn btn-primary ms-2'>
            Edit User
          </Link>
        )}
      </div>
      <div className="card-footer text-muted">
        Registered {moment(item.createdOn).fromNow()}
      </div>
    </div>
  );
};

UserListItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    givenName: PropTypes.string.isRequired,
    familyName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    createdOn: PropTypes.string.isRequired,
  }).isRequired,
  auth: PropTypes.shape({
    role: PropTypes.array.isRequired,
  }).isRequired,
};

export default UserListItem;
