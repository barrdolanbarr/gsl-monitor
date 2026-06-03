"""GSL-SWY+ : snow-aware monthly water-balance model for the Great Salt Lake basin.

A v1 implementation of the model described in GSL_SWY_Plus_Model_Design.pdf, extending
InVEST Seasonal Water Yield at its three documented weaknesses: (1) no snow, (2) no
sub-annual timing, (3) relative-not-absolute baseflow.

Pipeline (monthly, per hypsometric elevation band):
    forcing  -> P, Tmean, Tmax/Tmin, PET per band/month
    snow     -> rain/snow split, SWE accumulation, degree-day melt, sublimation
    balance  -> SCS-CN quickflow, soil-bucket AET (PET*Ks), recharge -> linear-reservoir baseflow
    routing  -> aggregate band runoff -> outlet streamflow (cfs / acre-ft) -> lake-stage effect
    seeding  -> paired run with a cool-season precip increment; difference = causal seeding effect

Calibrated against 76 yr of USGS monthly streamflow at the basin outlet (Bear R. near Corinne).
"""

__version__ = "0.1.0"
