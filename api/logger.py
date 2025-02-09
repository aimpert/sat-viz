import logging

def get_logger():
    logger = logging.getLogger("app_logger")
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        uvicorn_logger = logging.getLogger("uvicorn")
        for handler in uvicorn_logger.handlers:
            logger.addHandler(handler)
        # handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')) 
    return logger