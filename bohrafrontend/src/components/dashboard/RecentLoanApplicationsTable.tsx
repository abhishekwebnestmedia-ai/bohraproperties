import { usePropertyLeads } from '../../hooks/usePropertyLeads';
import { useFinanceLeads } from '../../hooks/useFinanceLeads';
import type { PropertyLead } from '../../services/propertyLeadsService';
import type { FinanceLead } from '../../services/financeLeadsService';

interface RecentLoanApplicationsTableProps {
  type?: 'property' | 'finance';
}

const RecentLoanApplicationsTable = ({ type = 'property' }: RecentLoanApplicationsTableProps) => {
  // Fetch completed leads based on type
  const { data: propertyData } = usePropertyLeads(
    type === 'property' ? { status: 'Completed', limit: 5 } : undefined
  );
  
  const { data: financeData } = useFinanceLeads(
    type === 'finance' ? { status: 'login', limit: 5 } : undefined
  );

  const applications: Array<PropertyLead | FinanceLead> =
    type === 'property' ? propertyData?.data || [] : financeData?.data || [];

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent {type === 'finance' ? 'Loan Applications' : 'Completed Deals'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Number
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.length > 0 ? (
              applications.map((application: PropertyLead | FinanceLead) => (
                <tr
                  key={application._id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {application.clientName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {application.contactNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {application.email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {application.source || 'N/A'}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No applications found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentLoanApplicationsTable;
