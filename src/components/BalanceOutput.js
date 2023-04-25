import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  /* YOUR CODE GOES HERE */

  // set up custom user input to handle wildcards
  const userInput = {
    startPeriodTime: utils.checkDateisValid(state.userInput.startPeriod) ? state.userInput.startPeriod.getTime() : -Infinity,
    endPeriodTime: utils.checkDateisValid(state.userInput.endPeriod) ? state.userInput.endPeriod.getTime() : Infinity,
    startAccount: isNaN(state.userInput.startAccount) ? -Infinity : state.userInput.startAccount,
    endAccount: isNaN(state.userInput.endAccount) ? Infinity : state.userInput.endAccount,
  }

  balance = state.journalEntries
  .filter((jrnl) => {
    if (userInput.startPeriodTime <= jrnl.PERIOD.getTime() &&
        userInput.endPeriodTime >= jrnl.PERIOD.getTime() &&
        userInput.startAccount <= jrnl.ACCOUNT &&
        userInput.endAccount >= jrnl.ACCOUNT
        ) {
          return true;
    }
    return false;
  });

  balance = Object.values(balance
  .reduce((acc, curr) => {
    if (acc[curr.ACCOUNT]) {
      acc[curr.ACCOUNT].DEBIT += curr.DEBIT;
      acc[curr.ACCOUNT].CREDIT += curr.CREDIT;
      return acc;
    } else {
      return {...acc, [curr.ACCOUNT]: {...curr}}
    }
  } , {}));

  const accountDict = state.accounts.reduce((acc, curr) => {
    const { ACCOUNT, LABEL } = curr;
    return {...acc, [ACCOUNT]: LABEL};
  } , {});

  balance = balance
  .filter((jrnl) => accountDict[jrnl.ACCOUNT])
  .map((jrnl) => ({
    ACCOUNT: jrnl.ACCOUNT,
    DESCRIPTION: accountDict[jrnl.ACCOUNT],
    DEBIT: jrnl.DEBIT,
    CREDIT: jrnl.CREDIT,
    BALANCE: jrnl.DEBIT - jrnl.CREDIT,
  }));

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
