import PropTypes from 'prop-types';
import moment from 'moment';
import { Link } from 'react-router-dom';

const BugListItem = ({ item }) => {
  // Determine badge styles based on classification
  const classificationBadgeClass = {
    Approved: 'badge badge-gradient badge-gradient-primary',
    Unapproved: 'badge badge-gradient badge-gradient-danger',
    Duplicate: 'badge badge-gradient badge-gradient-warning',
    Unclassified: 'badge badge-gradient badge-gradient-light',
  }[item.classification] || 'badge badge-gradient badge-gradient-secondary';

  // Determine status badge based on item.closed boolean
  const statusBadgeClass = item.closed 
    ? 'badge badge-gradient badge-gradient-danger'
    : 'badge badge-gradient badge-gradient-success';

  return (
    <div className="card mb-3 entity-card">
      <div className="card-body d-flex flex-column flex-md-row justify-content-between gap-3 align-items-start align-items-md-center">
        <div>
          <h5 className="card-title mb-2">{item.title}</h5>
          <p className="mb-2 text-muted">Assigned to: {item.assignedToUserName || 'Unassigned'}</p>
          <p className="mb-0 d-flex gap-2 flex-wrap">
            <span className={classificationBadgeClass}>{item.classification}</span>
            <span className={statusBadgeClass}>{item.closed ? 'Closed' : 'Open'}</span>
          </p>
        </div>
        <Link to={`/bugs/${item._id}`} className='btn btn-primary'>
          View bug
        </Link>
      </div>
      <div className="card-footer text-muted small bg-transparent border-0 pt-0 px-3 pb-3">
        Created {moment(item.createdOn).fromNow()} by {item.createdBy || item.author || 'Unknown'}
      </div>
    </div>
  );
};

BugListItem.propTypes = {
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

export default BugListItem;




