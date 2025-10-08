import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

const MyBugListItem = ({ item }) => {
  // Determine badge styles based on classification
  const classificationBadgeClass = {
    Approved: 'badge bg-success',
    Unapproved: 'badge bg-danger',
    Duplicate: 'badge bg-danger',
    Unclassified: 'badge bg-warning',
  }[item.classification] || 'badge bg-secondary';

  // Determine status badge based on item.closed boolean
  const statusBadgeClass = item.closed 
    ? 'badge bg-danger'  // If closed is true, display red badge
    : 'badge bg-success'; // If closed is false, display green badge

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{item.title}</h5>
        <p>Assigned to: {item.assignedToUserName || 'Unassigned'}</p>
        <p>
          <span className={classificationBadgeClass}>{item.classification}</span>{' '}
          <span className={statusBadgeClass}>{item.closed ? 'Closed' : 'Open'}</span>
        </p>
        <Link to={`/bugs/${item._id}`} className='btn btn-primary'>
          View Bug
        </Link>
      </div>
      <div className="card-footer text-muted">
        Created {moment(item.createdOn).fromNow()} by {item.createdBy || item.author || 'Unknown'}
      </div>
    </div>
  );
};

MyBugListItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    classification: PropTypes.string.isRequired,
    closed: PropTypes.bool.isRequired,
    assignedToUserName: PropTypes.string,
    createdOn: PropTypes.string.isRequired,
    createdBy: PropTypes.string,
    author: PropTypes.string,
  }).isRequired,
};

export default MyBugListItem;