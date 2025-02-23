from db_utils import Base
from sqlalchemy import TIMESTAMP, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import date, datetime
from typing import List

class Satellite(Base):
    __tablename__ = "satellites"

    norad_id: Mapped[int] = mapped_column(primary_key=True, nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    country: Mapped[str] = mapped_column(nullable=True)
    launch_date: Mapped[date] = mapped_column(nullable=True)

    tles: Mapped[List["SatelliteTLEs"]] = relationship("SatelliteTLEs", back_populates="satellite")

class SatelliteTLEs(Base):
    __tablename__ = "satellite_tle"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, nullable=False)
    norad_id: Mapped[int] = mapped_column(ForeignKey('satellites.norad_id'), nullable=False)
    tle_line1: Mapped[str] = mapped_column(nullable=False)
    tle_line2: Mapped[str] = mapped_column(nullable=False)
    timestamp: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True, server_default=func.now())

    __table_args__ = (UniqueConstraint('norad_id', 'timestamp', name='uq_norad_timestamp'),)

    satellite: Mapped["Satellite"] = relationship("Satellite", back_populates="tles")