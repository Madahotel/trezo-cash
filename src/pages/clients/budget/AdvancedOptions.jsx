import React, { useState } from 'react';
import { Settings, Lock, ChevronDown } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';

const AdvancedOptions = ({
  amountType = 'ttc',
  onAmountTypeChange,
  vatRateId,
  onVatRateChange,
  vatRates = [],
  isProvision = false,
  onProvisionChange,
  numProvisions,
  onNumProvisionsChange,
  provisionDetails,
  onProvisionDetailsChange,
  provisionAccountOptions = [],
  showProvisionButton = false,
  calculatedAmounts = { htAmount: 0, ttcAmount: 0, vatAmount: 0 },
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Options de taux de TVA
  const vatRateOptions = vatRates.map((rate) => ({
    value: rate.id.toString(),
    label: `${rate.name} (${rate.rate}%)`,
    rate: parseFloat(rate.rate),
  }));

  return (
    <div className="border rounded-lg bg-gray-50">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        className="w-full flex justify-between items-center p-3 text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <Settings size={16} />
          Options avancées
        </span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isAdvancedOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t space-y-4">
              {/* Description */}

              {/* Type de montant et TVA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="amount-type"
                    className="text-sm font-medium text-gray-700"
                  >
                    Type de Montant
                  </Label>
                  <select
                    id="amount-type"
                    value={amountType}
                    onChange={(e) => onAmountTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm mt-1"
                  >
                    <option value="ttc">TTC</option>
                    <option value="ht">HT</option>
                  </select>
                </div>

                {amountType === 'ht' && (
                  <div>
                    <Label
                      htmlFor="vat-rate"
                      className="text-sm font-medium text-gray-700"
                    >
                      Taux de TVA
                    </Label>
                    <select
                      id="vat-rate"
                      value={vatRateId || ''}
                      onChange={(e) => onVatRateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm mt-1"
                    >
                      <option value="">Aucun</option>
                      {vatRateOptions.map((rate) => (
                        <option key={rate.value} value={rate.value}>
                          {rate.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Affichage des montants calculés */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Montant HT: {calculatedAmounts.htAmount.toFixed(2)}</p>
                <p>Montant TTC: {calculatedAmounts.ttcAmount.toFixed(2)}</p>
                {vatRateId && (
                  <p>TVA: {calculatedAmounts.vatAmount.toFixed(2)}</p>
                )}
              </div>

              {/* Provision pour dépenses */}
              {showProvisionButton && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isProvision"
                      checked={isProvision}
                      onCheckedChange={(checked) => onProvisionChange(checked)}
                    />
                    <Label
                      htmlFor="isProvision"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Lock size={14} />
                      Provisionner cette dépense
                    </Label>
                  </div>

                  <AnimatePresence>
                    {isProvision && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pl-6">
                          <div>
                            <Label htmlFor="numProvisions" className="text-xs">
                              Nombre de provisions
                            </Label>
                            <Input
                              id="numProvisions"
                              type="number"
                              value={numProvisions}
                              onChange={(e) =>
                                onNumProvisionsChange(e.target.value)
                              }
                              placeholder="Ex: 12 pour mensualiser une dépense annuelle"
                              className="w-full text-sm"
                            />
                          </div>

                          <div>
                            <Label
                              htmlFor="provisionAccount"
                              className="text-xs"
                            >
                              Compte de provision
                            </Label>
                            <select
                              id="provisionAccount"
                              value={provisionDetails.provisionAccountId}
                              onChange={(e) =>
                                onProvisionDetailsChange({
                                  ...provisionDetails,
                                  provisionAccountId: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                            >
                              <option value="">Sélectionner un compte</option>
                              {provisionAccountOptions.map((account) => (
                                <option
                                  key={account.value}
                                  value={account.value}
                                >
                                  {account.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <Label
                              htmlFor="finalPaymentDate"
                              className="text-xs"
                            >
                              Date de paiement final
                            </Label>
                            <Input
                              id="finalPaymentDate"
                              type="date"
                              value={provisionDetails.finalPaymentDate}
                              onChange={(e) =>
                                onProvisionDetailsChange({
                                  ...provisionDetails,
                                  finalPaymentDate: e.target.value,
                                })
                              }
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedOptions;
