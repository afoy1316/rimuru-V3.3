"""
BitShip Multi-Courier Shipping Integration Client
Handles all communication with BitShip API for shipping rate calculation,
order creation, and tracking.
"""

import httpx
import logging
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class BiteshipClient:
    """Client for interacting with BitShip API"""
    
    def __init__(self):
        self.base_url = os.getenv("BITESHIP_BASE_URL", "https://api.biteship.com")
        self.api_key = os.getenv("BITESHIP_API_KEY")
        
        if not self.api_key:
            raise ValueError("BITESHIP_API_KEY environment variable is required")
        
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def get_rates(
        self,
        origin_postal_code: int,
        destination_postal_code: int,
        couriers: str,
        items: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate shipping rates from multiple couriers.
        
        Args:
            origin_postal_code: Origin postal code
            destination_postal_code: Destination postal code
            couriers: Comma-separated courier codes (e.g., "jne,jnt,sicepat")
            items: List of items with name, value, weight, length, width, height
            
        Returns:
            Dict containing success status and pricing options from couriers
        """
        payload = {
            "origin_postal_code": origin_postal_code,
            "destination_postal_code": destination_postal_code,
            "couriers": couriers,
            "items": items
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/rates/couriers",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"✅ Retrieved shipping rates for {couriers}")
                return result
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ BitShip API error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to get shipping rates: {e.response.text}")
        except Exception as e:
            logger.error(f"❌ Error fetching rates: {str(e)}")
            raise
    
    async def create_order(
        self,
        shipper_contact_name: str,
        shipper_contact_phone: str,
        shipper_contact_email: str,
        shipper_organization: str,
        origin_contact_name: str,
        origin_contact_phone: str,
        origin_address: str,
        origin_postal_code: int,
        destination_contact_name: str,
        destination_contact_phone: str,
        destination_address: str,
        destination_postal_code: int,
        courier_company: str,
        courier_type: str,
        items: List[Dict[str, Any]],
        origin_note: str = "",
        destination_note: str = "",
        destination_contact_email: str = "",
        courier_insurance: int = 0,
        delivery_type: str = "now",
        order_note: str = "",
        reference_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new shipping order with BitShip.
        Automatically generates AWB (airway bill) number.
        
        Returns:
            Dict containing order details including waybill_id
        """
        payload = {
            "shipper_contact_name": shipper_contact_name,
            "shipper_contact_phone": shipper_contact_phone,
            "shipper_contact_email": shipper_contact_email,
            "shipper_organization": shipper_organization,
            "origin_contact_name": origin_contact_name,
            "origin_contact_phone": origin_contact_phone,
            "origin_address": origin_address,
            "origin_postal_code": origin_postal_code,
            "origin_note": origin_note,
            "destination_contact_name": destination_contact_name,
            "destination_contact_phone": destination_contact_phone,
            "destination_contact_email": destination_contact_email,
            "destination_address": destination_address,
            "destination_postal_code": destination_postal_code,
            "destination_note": destination_note,
            "courier_company": courier_company,
            "courier_type": courier_type,
            "courier_insurance": courier_insurance,
            "delivery_type": delivery_type,
            "order_note": order_note,
            "items": items
        }
        
        if reference_id:
            payload["reference_id"] = reference_id
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v1/orders",
                    json=payload,
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"✅ Created BitShip order: {result.get('id')}")
                return result
        except httpx.HTTPStatusError as e:
            error_text = e.response.text
            logger.error(f"❌ BitShip order creation error: {e.response.status_code} - {error_text}")
            
            # Check for specific BitShip API key activation error
            if "40002002" in error_text or "Key has not been activated" in error_text:
                raise Exception("BitShip API Key belum diaktivasi untuk membuat order. Silakan hubungi BitShip support atau aktifkan fitur order creation di dashboard BitShip.")
            else:
                raise Exception(f"Failed to create shipping order: {error_text}")
        except Exception as e:
            logger.error(f"❌ Error creating order: {str(e)}")
            raise
    
    async def track_order(self, waybill_id: str, courier_code: str) -> Dict[str, Any]:
        """
        Track a shipment using waybill ID and courier code.
        
        Args:
            waybill_id: The waybill/AWB number
            courier_code: Courier company code (e.g., 'jne', 'jnt')
            
        Returns:
            Dict containing tracking information
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v1/trackings/{waybill_id}/couriers/{courier_code}",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                logger.info(f"✅ Retrieved tracking for {waybill_id}")
                return result
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ BitShip tracking error: {e.response.status_code} - {e.response.text}")
            raise Exception(f"Failed to get tracking info: {e.response.text}")
        except Exception as e:
            logger.error(f"❌ Error tracking order: {str(e)}")
            raise
    
    async def get_couriers(self) -> Dict[str, Any]:
        """
        Retrieve list of all available courier services.
        
        Returns:
            Dict containing list of available couriers
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v1/couriers",
                    headers=self.headers,
                    timeout=30.0
                )
                response.raise_for_status()
                result = response.json()
                logger.info("✅ Retrieved available couriers")
                return result
        except Exception as e:
            logger.error(f"❌ Error retrieving couriers: {str(e)}")
            raise


# Singleton instance
_biteship_client = None

def get_biteship_client() -> BiteshipClient:
    """Get or create BitShip client singleton"""
    global _biteship_client
    if _biteship_client is None:
        _biteship_client = BiteshipClient()
    return _biteship_client
