import { useEthPrice } from "@components/hooks/useEthPrice";
import { Modal, Button } from "@components/ui/common";
import { useState, useEffect } from "react";

const default_order = {
  price: "",
  email: "",
  confirm_email: ""
}

const _create_form_state = (isDisabled = false, message =  "") => ({isDisabled, message})

const create_form_state = ({price, email, confirm_email}, hasAgreedTOS, isNewPurchase) => {
  if (!price || Number(price) <= 0) {
    return _create_form_state(true, "Price is not valid.")
  }

  if (isNewPurchase) {
    if (confirm_email.length === 0 || email.length === 0) {
      return _create_form_state(true)
    }
    else if (email !== confirm_email) {
      return _create_form_state(true, "Email are not matching.")
    }
  }

  if (!hasAgreedTOS) {
    return _create_form_state(true, "You need to agree with terms of service in order to submit the form")
  }

  return _create_form_state()
}

export default function OrderModal({ course, onClose, onSubmit, is_new_purchase }) {
  const [is_open, set_is_open] = useState(false);
  const [order, set_order] = useState(default_order);
  const [enable_price, set_enable_price] = useState(false);
  const [tos_agreed, set_tos_agreed] = useState(false);

  const { eth } = useEthPrice();
  const form_state = create_form_state(order, tos_agreed, is_new_purchase);

  useEffect(() => {
    if (!!course) {
      set_is_open(true);
      set_order({ ...default_order, price: eth.per_item })
    }
  }, [course])

  function handle_close() {
    set_is_open(false);
    set_order(default_order);
    set_enable_price(false);
    set_tos_agreed(false);
    onClose();
  }

  function handle_price_change(event) {
    const value = event.target.value;

    if (isNaN(value))
      return;

    set_order({ ...order, price: value })
  }

  return (
    <Modal is_open={is_open}>
      <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="mb-7 text-lg font-bold leading-6 text-gray-900" id="modal-title">
                {course.title}
              </h3>

              <div className="mt-1 relative rounded-md">
                <div className="mb-1">
                  <label className="mb-2 font-bold">Price(eth)</label>
                  <div className="text-xs text-gray-700 flex">
                    <label className="flex items-center mr-2">
                      <input
                        onChange={(event) => {
                          const value = event.target.checked;

                          set_order({
                            ...order,
                            price: value ? order.price : eth.per_item
                          });

                          set_enable_price(value);
                        }}
                        checked={enable_price}
                        type="checkbox"
                        className="form-checkbox"
                      />
                    </label>
                    <span>Adjust Price - only when the price is not correct</span>
                  </div>
                </div>

                <input
                  disabled={!enable_price}
                  onChange={handle_price_change}
                  value={order.price}
                  type="text"
                  name="price"
                  id="price"
                  className="disabled:opacity-50 w-80 mb-1 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-700">
                  Price will be verified at the time of the order. If the price will be lower, order can be declined (+- 2% slipage is allowed)
                </p>
              </div>
              {is_new_purchase &&
                <>
                  <div className="mt-2 relative rounded-md">
                    <div className="mb-1">
                      <label className="mb-2 font-bold">Email</label>
                    </div>
                    <input
                      onChange={(event) => {
                        set_order({
                          ...order,
                          email: event.target.value.trim()
                        })
                      }}
                      type="email"
                      name="email"
                      id="email"
                      className="w-80 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md"
                      placeholder="x@y.com"
                    />
                    <p className="text-xs text-gray-700 mt-1">
                      It&apos;s important to fill a correct email, otherwise the order cannot be verified. We are not storing your email anywhere
                    </p>
                  </div>

                  <div className="my-2 relative rounded-md">
                    <div className="mb-1">
                      <label className="mb-2 font-bold">Repeat Email</label>
                    </div>
                    <input
                      onChange={(event) => {
                        set_order({
                          ...order,
                          confirm_email: event.target.value.trim()
                        })
                      }}
                      type="email"
                      name="confirmationEmail"
                      id="confirmationEmail"
                      className="w-80 focus:ring-indigo-500 shadow-md focus:border-indigo-500 block pl-7 p-4 sm:text-sm border-gray-300 rounded-md" placeholder="x@y.com" />
                  </div>
                </>
              }
              <div className="text-xs text-gray-700 flex mt-5">
                <label className="flex items-center mr-2">
                  <input
                    value={tos_agreed}
                    onChange={() => set_tos_agreed(!tos_agreed)}
                    type="checkbox"
                    className="form-checkbox" />
                </label>
                <span>I accept Eincode &apos;terms of service&apos; and I agree that my order can be rejected in the case data provided above are not correct</span>
              </div>

              {form_state.message &&
                <div className="p-4 my-3 text-red-700 bg-red-200 rounded-lg text-sm">
                  {form_state.message}
                </div>
              }

            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex">
          <Button
            disabled={form_state.is_disabled}
            onClick={() => { 
              onSubmit(order, course); handle_close(); 
            }}
          >
            Submit
          </Button>
          <Button
            onClick={handle_close}
            variant="red">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}