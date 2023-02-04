import React, { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { DebtEntryFromDb } from "../../models/bill-tracking.model";
import { useSelector } from "react-redux";
import { RootState } from "../../../../app/store";
import {
  formatDate,
  formatSenderReceiver,
  textColorFormat,
  renderSenderReceiverColor, textOpacityFormat
} from "../../state/functions/bill-tracking.functions";
import '../../css/debt-table.css';
import { DebtDirection } from "../../constants/bill-tracking.constants";
import { BillTrackingContext } from "../../state/context/bill-tracking-context";
import { DateTime } from "luxon";
import { completeDebt, sendToArchive } from "../../api/bill-tracking.api";
import { toast } from "react-toastify";
import { errorHandler } from "../../../../global/functions/error-handler/error-handler";

const DebtTable = () => {
  const {
    displayedTableData,
    selectedRowData,
    setSelectedRowData,
    deferredSearch,
    debtDirection,
    deleteFromTableData,
    updateTableData,
    archivedTableData,
    isArchive
  } = useContext(BillTrackingContext);
  const userId = useSelector((state: RootState) => state.auth.userDatabaseId);


  const headerClass = "px-6 py-3"
  const cellClassLong = "px-6 py-4 truncate"

  const sortByDate = (tableData: DebtEntryFromDb[]) => {
    return tableData.sort((a: DebtEntryFromDb, b: DebtEntryFromDb) => {
      const dateA = a.next_recurrence_date ? DateTime.fromISO(a.next_recurrence_date!) : null;
      const dateB = b.next_recurrence_date ? DateTime.fromISO(b.next_recurrence_date!) : null;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.diff(dateB).as('seconds');
    })
  }

  const filterSearchQuery = (debtItem: DebtEntryFromDb) => {
    let userIsSender: boolean = userId === debtItem.sender_id;

    return (
      debtItem.amount.toString().includes(deferredSearch!) ||
      debtItem.description.toLowerCase().includes(deferredSearch!.toLowerCase()) ||
      (userIsSender ? (
        debtItem.receiver_data.name.toLowerCase().includes(deferredSearch!.toLowerCase())
      ) : (
        debtItem.sender_data.name.toLowerCase().includes(deferredSearch!.toLowerCase())
      ))
    );
  };

  const filterDebtDirection = (debtItem: DebtEntryFromDb) => {
    switch (debtDirection) {
      case (DebtDirection.FROM):
        return debtItem.receiver_id === userId;
      case (DebtDirection.TO):
        return debtItem.sender_id === userId;
      default:
        return true;
    }
  };

  const handleComplete = (selectedRowData: DebtEntryFromDb) => {

    const updatedRowData: Partial<DebtEntryFromDb> = { original_id: selectedRowData.id, ...selectedRowData };
    delete updatedRowData.receiver_data;
    delete updatedRowData.sender_data;
    delete updatedRowData.id;

    sendToArchive(updatedRowData!).then(response => {
    }).catch(error => errorHandler(error));

    completeDebt(updatedRowData!).then((response: DebtEntryFromDb) => {
      if (response === null) {
        deleteFromTableData(updatedRowData.id!);
        setSelectedRowData(null);
      } else {
        updateTableData(response.id, response);
      }
      toast(`Success: Debt archived and completed. Next due date has been updated.`, { type: 'success' })
    }).catch(error => errorHandler(error));
  }

  const deleteArchive = () => {

  }

  useEffect(() => {
    console.log(selectedRowData);
  }, [selectedRowData])

  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-left text-sm text-gray-300 border-separate border-spacing-0 table-fixed">
        <thead className="text-xs uppercase bg-gray-50 bg-gray-700 text-white sticky top-0">
        <tr>
          <th scope="col" className={headerClass}>To/From</th>
          <th scope="col" className={headerClass}>Amount</th>
          <th scope="col" className={headerClass}>Description</th>
          <th scope="col" className={headerClass}>Due Date</th>
          <th scope="col" className={headerClass}>Frequency</th>
          <th scope="col" className={headerClass}></th>
        </tr>
        </thead>

        <tbody>
        {sortByDate(isArchive ? archivedTableData : displayedTableData)
          .filter(debtItem => filterDebtDirection(debtItem))
          .filter(debtItem => filterSearchQuery(debtItem))
          .map(debtItem => (
            <tr
              key={debtItem.id}
              onClick={() => setSelectedRowData(debtItem)}
              className={`debt-table-row font-medium border-gray-700 hover:bg-gray-500 cursor-pointer ${debtItem.id === selectedRowData?.id ? 'bg-gray-600 debt-table-row-selected' : ''} `}
            >

              {/* Name */}
              <th scope="row"
                  className={`px-6 py-4 font-medium text-white truncate ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
                {formatSenderReceiver(userId!, debtItem.sender_id, debtItem.sender_data, debtItem.receiver_data)}
              </th>

              {/*Amount*/}
              <td
                className={`px-6 py-4 truncate ${renderSenderReceiverColor(userId!, debtItem.sender_id)} ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
                {`$ ${debtItem.amount}`}
              </td>

              {/*Description*/}
              <td className={`${cellClassLong} ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
                {debtItem.description}
              </td>

              {/*Due Date*/}
              <td className={`${cellClassLong} ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
              <span
                className={`flex space-x-2 items-center ${textColorFormat(debtItem.next_recurrence_date)} ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
                <p>{formatDate(debtItem.next_recurrence_date)}</p>
                {textColorFormat(debtItem.next_recurrence_date) && <i className="fa fa-exclamation-triangle"/>}
              </span>
              </td>

              {/*Frequency*/}
              <td className={`${cellClassLong} ${textOpacityFormat(debtItem.next_recurrence_date)}`}>
                {debtItem.frequency_interval}
              </td>

              {/*Complete*/}
              {!isArchive ? (
                <td className={`pl-12`}>
                  <button className="hover:text-green-500" onClick={() => handleComplete(debtItem)}>
                    <i className="fa fa-check-circle-o" style={{ fontSize: '1.5rem', margin: 0 }}></i>
                  </button>
                </td>
              ) : (
                <td className={`pl-12`}>
                  <button className="hover:text-red-500" onClick={() => deleteArchive()}>
                    <i className="fa fa-trash" style={{ fontSize: '1.5rem', margin: 0 }}></i>
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

export default DebtTable;