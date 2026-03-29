import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

const UserListItem = ({ item, auth }) => {
  const fullName = `${item.givenName} ${item.familyName}`;
  const isAdmin = auth.role.includes('Admin');
  const isTechnicalManager = auth.role.includes('Technical Manager');

  return (
    <div className="card mb-3 entity-card">
      <div className="card-body d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          <h5 className="card-title mb-1">{fullName}</h5>
          <p className="mb-0 text-muted">{item.role}</p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Link to={`/users/${item._id}`} className='btn btn-secondary'>
            View
          </Link>
          {(isAdmin || isTechnicalManager) && (
            <Link to={`/users/${item._id}/edit`} className='btn btn-primary'>
              Edit
            </Link>
          )}
        </div>
      </div>
      <div className="card-footer text-muted small bg-transparent border-0 pt-0 px-3 pb-3">
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
