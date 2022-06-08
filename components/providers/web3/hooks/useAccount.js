import useSWR from "swr";
import { useEffect, useState } from "react";

const admin_address_list = {
  "0x9c35bdf369d46914aa94a6c8d6790bb8a01be8b7398f9fde3a7db011c6229637": true,
  "0xa8ed547f2db8b591c2324ce963adf34ec499ffb4ae14a49fbf7382b4db1a05a4": true,
  "0xfbfe50a3eb37cf3c233036e66d2c1b196ee304d6dc341efc356dd38276ec879a": true
}

export const handler = (web3, provider) => () => {

  const { data, mutate, ...rest } = useSWR(() => { return web3 != null ? "web3/accounts" : null },
    async () => {
      const accounts = await web3.eth.getAccounts();
      return accounts[0];
    }
  );

  useEffect(() => {
    provider &&
      provider.on("accountsChanged", (acc) => mutate(acc[0] ?? null))
  }, [provider])

  return {
    data,
    isAdmin: (data && admin_address_list[web3.utils.keccak256(data)]) ?? false,
    mutate,
    ...rest
  }
}